import { Lead, AppSettings, Interaction, MarketingCampaign, saveSettings, saveAutomationAuditLogEntry, getChatbotSettings, ChatbotSettings } from './db';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, writeBatch, doc, addDoc } from 'firebase/firestore';
import { whatsappService } from '../services/whatsappService';

/**
 * Logs an automation event or error for the audit hub.
 */
export const logAutomationEvent = async (params: { 
  leadId?: string; 
  leadName?: string; 
  message: string; 
  type: 'Campaign' | 'Interaction' | 'System';
  isError?: boolean;
}) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const errorPrefix = params.isError ? "🚨 ERROR: " : "✅ ";
    await saveAutomationAuditLogEntry({
      type: 'automation_event',
      description: `${errorPrefix}${params.message}`,
      leadId: params.leadId,
      leadName: params.leadName,
      timestamp: new Date().toISOString(),
      executedBy: 'system',
      metadata: { category: params.type },
      ownerId: user.uid,
      status: params.isError ? 'Failed' : 'Success',
      affectedCount: 1
    });
  } catch (err) {
    console.error("Failed to log automation event", err);
  }
};

/**
 * Standard business messaging protocol for cross-channel delivery.
 */
export const sendBusinessMessage = async (
  lead: Lead, 
  content: string, 
  settings: AppSettings,
  options?: {
    channel?: 'WhatsApp' | 'Instagram';
    templateName?: string;
    templateParams?: any[];
  }
): Promise<{ success: boolean; error?: string }> => {
  if (lead.status === 'Archived' || lead.status === 'Blacklisted') {
    return { success: false, error: "Lead is inactive. Messages are disabled." };
  }

  const channel = options?.channel || 'WhatsApp';
  
  if (channel === 'WhatsApp') {
    if (!lead.mobileNumber) return { success: false, error: "Missing mobile number for WhatsApp delivery." };
    
    whatsappService.updateConfig(
      settings.whatsappApiToken || null, 
      settings.whatsappPhoneId || null, 
      null, null, 'api'
    );

    const result = await whatsappService.sendMessage({
      to: lead.mobileNumber,
      message: content,
      templateCategory: 'custom',
      customTemplateName: options?.templateName,
      templateParams: options?.templateParams,
      platform: 'whatsapp'
    });

    if (result.success) {
      await logAutomationEvent({ 
        leadId: lead.id, 
        leadName: lead.name, 
        message: `Message dispatched via WhatsApp`, 
        type: 'Interaction' 
      });
      return { success: true };
    } else {
      await logAutomationEvent({ 
        leadId: lead.id, 
        leadName: lead.name, 
        message: `WhatsApp Delivery Failed: ${result.error}`, 
        type: 'Interaction',
        isError: true
      });
      return { success: false, error: result.error };
    }
  } else if (channel === 'Instagram') {
    if (!lead.mobileNumber) return { success: false, error: "Missing ID for Instagram delivery." }; // Actually we store IGSID in mobileNumber or use another field

    const result = await whatsappService.sendMessage({
      to: lead.mobileNumber,
      message: content,
      platform: 'instagram'
    });

    if (result.success) {
      await logAutomationEvent({ 
        leadId: lead.id, 
        leadName: lead.name, 
        message: `Message dispatched via Instagram`, 
        type: 'Interaction' 
      });
      return { success: true };
    } else {
      await logAutomationEvent({ 
        leadId: lead.id, 
        leadName: lead.name, 
        message: `Instagram Delivery Failed: ${result.error}`, 
        type: 'Interaction',
        isError: true
      });
      return { success: false, error: result.error };
    }
  }

  return { success: false, error: "Unsupported channel protocol." };
};

/**
 * Global Automation Heartbeat
 * Runs periodically to process scheduled campaigns and nurturing rules.
 */
export const runAutomationHeartbeat = async (leads: Lead[], settings: AppSettings) => {
  if (!settings.automationEnabled) return;
  if ((window as any)._heartbeatRunning) return;

  (window as any)._heartbeatRunning = true;

  try {
    const now = new Date();
    
    // 1. Process Scheduled Campaigns
    const campaignsQuery = query(
      collection(db, 'marketing_campaigns'),
      where('ownerId', '==', auth.currentUser?.uid),
      where('status', 'in', ['Scheduled', 'Active'])
    );
    const campaignSnaps = await getDocs(campaignsQuery);
    const campaigns = campaignSnaps.docs.map(d => ({ id: d.id, ...d.data() } as MarketingCampaign));

    for (const campaign of campaigns) {
      if (campaign.status === 'Scheduled') {
        const scheduleDate = new Date(campaign.scheduledAt || "");
        if (scheduleDate > now) continue;
      }
      
      console.log(`Executing Campaign: ${campaign.title}`);
      
      // Target specific lead segments based on campaign types
      let targetLeads = leads.filter(l => l.status === 'New' || l.status === 'Qualified');
      
      if (campaign.triggerType === 'Birthday') {
         const today = new Date();
         targetLeads = leads.filter(l => l.dateOfBirth && new Date(l.dateOfBirth).getMonth() === today.getMonth() && new Date(l.dateOfBirth).getDate() === today.getDate());
      }
      
      let successCount = 0;
      for (const lead of targetLeads) {
        const res = await sendBusinessMessage(lead, campaign.messageTemplate, settings, {
          channel: campaign.channel === 'Bulk' ? 'WhatsApp' : campaign.channel,
          templateName: campaign.metaTemplateId
        });
        if (res.success) successCount++;
        // Throttling
        await new Promise(r => setTimeout(r, 500));
      }

      // Update campaign status
      const batch = writeBatch(db);
      if (campaign.status === 'Scheduled') {
          batch.update(doc(db, 'marketing_campaigns', campaign.id), {
            status: 'Completed',
            sentCount: successCount
          });
      } else {
          // For active birthday/festival campaigns, update sentCount, but keep active or update lastSent
          batch.update(doc(db, 'marketing_campaigns', campaign.id), {
            sentCount: (campaign.sentCount || 0) + successCount,
            lastSent: new Date().toISOString()
          });
      }
      await batch.commit();

      await logAutomationEvent({ 
        message: `Campaign "${campaign.title}" triggered. Dispatched to ${successCount} leads.`, 
        type: 'Campaign' 
      });
    }

    // 2. Lead Nurture & System Automations
    const chatbotSettings = await getChatbotSettings();
    if (chatbotSettings) {
      const batch = writeBatch(db);
      let batchCount = 0;

      // Abandoned Inquiry Recovery
      if (chatbotSettings.abandonedInquiryRecovery) {
        const delayMs = (chatbotSettings.abandonedInquiryDelayMinutes || 60) * 60000;
        const cutoff = new Date(Date.now() - delayMs);
        
        const abandonedLeads = leads.filter(l => 
          (l.status === 'New' || l.status === 'FollowedUp' || l.status === 'Qualified' || l.status === 'Contacted') && 
          l.interestLevel === 'High' && 
          (!l.lastInteractedAt || new Date(l.lastInteractedAt) < cutoff) &&
          !l.inquiryAbandonedDelayTriggered
        );

        for (const lead of abandonedLeads) {
          const message = `Hi ${lead.name.split(' ')[0]}, we noticed you were interested in our products recently. The stock is moving fast! Let me know if you have any questions or would like to proceed with an order.`;
          const res = await sendBusinessMessage(lead, message, settings, { channel: 'WhatsApp' });
          if (res.success) {
            batch.update(doc(db, 'leads', lead.id), { inquiryAbandonedDelayTriggered: true, lastInteractedAt: new Date().toISOString() });
            batchCount++;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // AI Generative Re-engagement Loops
      if (chatbotSettings.followUpSequenceEnabled) {
        const deadCutoff = new Date(Date.now() - (7 * 24 * 60 * 60000)); // 7 days
        const deadLeads = leads.filter(l => 
          l.status !== 'Converted' && l.status !== 'Blacklisted' && l.status !== 'Archived' &&
          (!l.lastInteractedAt || new Date(l.lastInteractedAt) < deadCutoff) && 
          !l.reEngagementTriggered
        );

        for (const lead of deadLeads) {
          // Send a re-engagement ping
          const message = `Hi ${lead.name.split(' ')[0]}, it's been a while since we last spoke! Are you still looking for electronics or appliances? We have some great new arrivals you might like.`;
          const res = await sendBusinessMessage(lead, message, settings, { channel: 'WhatsApp' });
          if (res.success) {
            batch.update(doc(db, 'leads', lead.id), { reEngagementTriggered: true, lastInteractedAt: new Date().toISOString() });
            batchCount++;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        await logAutomationEvent({ 
          message: `Nurture Sequences triggered. Processed ${batchCount} leads for recovery.`, 
          type: 'System' 
        });
      }
    }

  } catch (err) {
    console.error("Automation heartbeat failed", err);
  } finally {
     setTimeout(() => { (window as any)._heartbeatRunning = false; }, 30000);
  }
};
