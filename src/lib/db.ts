import { v4 as uuidv4 } from 'uuid';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch, orderBy, limit, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota')) {
    console.warn('Firestore Quota Exceeded.', errInfo);
    // Lock background tasks for 12 hours locally when quota hits
    localStorage.setItem('firestore_quota_expiry', (Date.now() + 12 * 60 * 60 * 1000).toString());
    throw new Error('resource-exhausted: Your database quota has been exceeded. Please review usage or billing.');
  }

  if (errorMessage.includes('client is offline')) {
    console.warn(`\n[WARNING] Firestore Connection Failed (Client is Offline). Request to ${path || 'unknown path'} failed. Ensure your connection is stable and Firestore is provisioned.\n`, errInfo);
    return; // Do NOT throw, so we can fall back to null/default and not break the UI
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isQuotaExceeded = () => {
  const expiry = localStorage.getItem('firestore_quota_expiry');
  const allowUnlimited = localStorage.getItem('allowUnlimitedResources') === 'true';
  if (!allowUnlimited && expiry && Date.now() < parseInt(expiry)) {
    return true; // Limit exceeded and lock is enabled
  }
  return false;
};

export interface Lead {
  id: string;
  name: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  tags?: string[];
  source: 'Instagram' | 'WhatsApp' | 'Manual' | 'Web' | 'Referral';
  status: 'New' | 'FollowedUp' | 'Qualified' | 'Converted' | 'Lost' | 'Contacted' | 'Archived' | 'Blacklisted';
  interestLevel?: 'Low' | 'Medium' | 'High';
  lastInteraction?: string;
  createdAt?: string;
  ownerId?: string;
  notes?: string;
  // Advanced CRM & Retail OS tracking
  leadScore?: number; // 0-100 indicating likelihood to buy
  purchaseProbability?: 'High' | 'Medium' | 'Low';
  householdId?: string; // Links family members together
  householdRole?: 'Primary' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  householdMembers?: {
    id: string;
    name: string;
    relation: string;
    dob?: string;
    notes?: string;
  }[];
  customerValueScore?: number; // Estimated LTV
  estimatedBudget?: number;
  // Service & Retention
  lastPurchaseDate?: string;
  nextServiceDate?: string;
  warrantyExpiryDate?: string;
  predictedReplacementDate?: string;
  futureNeeds?: { id: string; name: string; date?: string; }[];
  customerMemory?: { id: string; type: string; text: string; }[];
  copilotEnabled?: boolean;
  campaignId?: string; // Associated marketing campaign
  instagramId?: string;
  lastInteractedAt?: string;
  inquiryAbandonedDelayTriggered?: boolean;
  reEngagementTriggered?: boolean;
}

export interface SocialAccount {
  id: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp';
  accountId?: string;
  accountName?: string;
  username?: string;
  accessToken: string;
  status: 'Active' | 'Disconnected' | 'Expired';
  ownerId?: string;
  profileImageUrl?: string;
  connectedAt?: string;
  createdAt?: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  channel: 'WhatsApp' | 'Instagram' | 'Bulk';
  messageTemplate: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Completed';
  sentCount: number;
  scheduledAt?: string;
  triggerType?: 'Manual' | 'Birthday' | 'Festival' | 'CustomDate' | 'Service' | 'Warranty' | 'Replacement';
  triggerCondition?: string;
  ownerId?: string;
  metaTemplateId?: string;
  createdAt?: string;
  budget?: number; // Financial cost of the campaign
  targetSegment?: string; // Target Segment (e.g. All, Hot, Warm, Cold)
  type?: 'Broadcast' | 'Sequence';
  sequenceSteps?: { delayDays: number; messageTemplate: string }[];
}

export interface Interaction {
  id: string;
  leadId: string;
  leadName: string;
  platform?: 'WhatsApp' | 'InstagramDM' | 'ManualNote' | 'Automation';
  type: 'WhatsApp' | 'InstagramDM' | 'ManualNote' | 'Automation';
  content: string;
  message?: string;
  status?: string;
  direction: 'Inbound' | 'Outbound';
  timestamp: string;
  createdAt?: string;
  ownerId?: string;
  isPotentialBuyer?: boolean;
}

export interface AutomationAuditLog {
  id?: string;
  ownerId: string;
  type: 'campaign_sent' | 'lead_captured' | 'auto_reply' | 'alert' | 'automation_event';
  description: string;
  affectedCount: number;
  timestamp: string;
  status: 'Success' | 'Partial' | 'Failed';
  executedBy: 'system' | 'admin';
  leadId?: string;
  leadName?: string;
  metadata?: any;
}

export const saveAutomationAuditLog = async (log: Omit<AutomationAuditLog, 'id'>) => {
  const q = collection(db, 'automation_audit');
  await addDoc(q, log);
};

export interface ReportFile {
  name: string;
  data: string; // Base64 or URL
  type: string;
}

export interface ReportFolder {
  id: string;
  name: string;
  ownerId?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  type?: string;
  content: string;
  createdAt: string;
  folderId?: string | null;
  ownerId?: string;
  files?: ReportFile[];
  assetLink?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  ownerId?: string;
}

export interface Conversion {
  id: string;
  leadId: string;
  amount: number;
  referenceId: string;
  date: string;
  ownerId?: string;
}

export interface AutomationSettings {
  leadCapturing: boolean;
  autoReplies: boolean;
  bulkMessaging: boolean;
  campaignScheduling: boolean;
  smartNotifications: boolean;
  autoNurture?: boolean;
}

export interface WhatsAppProvider {
  id: string; // The ID of the provider, e.g., 'meta', 'wati', etc.
  name: string; // The name of the provider, e.g., 'Meta Official API', 'WATI API'
  baseUrl: string; // The base URL for the API
  requiresApiKey: boolean; // Does the provider require an API key?
  requiresPhoneId: boolean; // Does the provider require a Phone ID?
  isActive: boolean; // Is the provider active?
}

export interface AutomationError {
  id: string;
  ownerId: string;
  error: string;
  timestamp: string;
  resolved: boolean;
  type?: string;
  details?: string;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
}

export interface CustomForm {
  id: string;
  title: string;
  triggerWord: string;
  fields: CustomFormField[];
  createdAt: string;
  ownerId?: string;
}

export interface ChatbotCommand {
  id: string;
  triggerWord: string;
  buttonLabel?: string;
  response: string;
  isActive: boolean;
  mediaUrl?: string;
  mediaName?: string;
  linkUrl?: string;
  isForm?: boolean;
  formId?: string;
}

export interface ChatbotSettings {
  autoResponderActive: boolean;
  welcomeMessage: string;
  handoffMessage: string;
  unknownQueryMessage: string;
  businessHoursOnly: boolean;
  commands?: ChatbotCommand[];
  // Advanced Sales Automation & CRM Engine
  aiSalesCopilotEnabled?: boolean;
  salesTone?: 'Aggressive' | 'Consultative' | 'Friendly' | 'Professional';
  abandonedInquiryRecovery?: boolean; // Follow up if lead stops responding
  abandonedInquiryDelayMinutes?: number;
  referralEngineEnabled?: boolean;
  referralTemplateId?: string;
  // Pre-configured follow up sequences
  followUpSequenceEnabled?: boolean;
}

export const getProviders = async (): Promise<WhatsAppProvider[]> => {
  if (!auth.currentUser) return [];
  try {
    const providersCol = collection(db, 'providers');
    const snapshot = await getDocs(providersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppProvider));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'providers');
    return [];
  }
};

export const addProvider = async (provider: WhatsAppProvider) => {
  if (!auth.currentUser || auth.currentUser.email !== 'ksmotalkar@gmail.com') throw new Error("Not authorized");
  checkQuotaBeforeWrite("Add Provider");
  const { id, ...providerData } = provider;
  try {
    await setDoc(doc(db, 'providers', id), providerData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'providers');
  }
};

export const deleteProvider = async (id: string) => {
  if (!auth.currentUser || auth.currentUser.email !== 'ksmotalkar@gmail.com') throw new Error("Not authorized");
  checkQuotaBeforeWrite("Delete Provider");
  try {
    await deleteDoc(doc(db, 'providers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'providers');
  }
};

export interface CustomAutomationParam {
  id: string;
  key: string;
  value: string;
  type: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | 'SALES_COPILOT' | 'REFERRAL' | 'ABANDONED_INQUIRY' | 'WARRANTY' | 'SERVICE_REMINDER' | 'ONBOARDING' | 'REENGAGEMENT' | 'COMPLAINT_SOLVED' | 'FORM_DISTRIBUTION';
  platform: 'WhatsApp' | 'Instagram' | 'SMS' | 'Email';
  content: string; 
  language: string;
  metaTemplateId?: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  ownerId: string;
  createdAt: string;
}

export const subscribeToTemplates = (callback: (templates: MessageTemplate[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'templates'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageTemplate)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'templates');
  });
};

export const addTemplate = async (template: Omit<MessageTemplate, 'id' | 'ownerId' | 'createdAt'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Templates");
  try {
    await addDoc(collection(db, 'templates'), {
      ...template,
      ownerId: user.uid,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'templates');
    throw error;
  }
};

export const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Templates");
  try {
    await updateDoc(doc(db, 'templates', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `templates/${id}`);
    throw error;
  }
};

export const deleteTemplate = async (id: string) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Templates");
  try {
    await deleteDoc(doc(db, 'templates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
    throw error;
  }
};

export interface MetaTemplateDef {
  id: string;
  templateName: string;
  parameters: string; // comma separated: e.g. "customer_name, balance, date"
}

export interface AppSettings {
  businessName?: string;
  businessLogo?: string | null;
  whatsappApiToken?: string;
  whatsappPhoneId?: string;
  whatsappVerifyToken?: string;
  whatsappApiMode?: 'manual' | 'api';
  whatsappTemplates?: {id: string, name: string, category: string, language: string, components: any[], variables?: string[], purpose?: string}[];
  instagramAppId?: string;
  instagramAppSecret?: string;
  instagramVerifyToken?: string;
  groqApiKey?: string;
  automationEnabled?: boolean;
  chatbotActive?: boolean;
  aiChatbotEnabled?: boolean;
  enableAiFeatures?: boolean;
  ownerId?: string;
  automation?: AutomationSettings;
  chatbotCommands?: ChatbotCommand[];
  appTheme?: string;
  appUiStyle?: string;
  preferredLanguage?: 'en' | 'hi' | 'pa';
  themeMode?: 'Auto' | 'Light' | 'Dark';
  themeAccentColor?: string;
  themeDensity?: 'Relaxed' | 'Standard' | 'Tight';
  themeFont?: string;
  themeCornerRadius?: number;
  themeSmoothAnimations?: boolean;
  themeBoldFocusRings?: boolean;
  themeShowGridLines?: boolean;
  themeCompactSidebar?: boolean;
  enableBillingAndSupport?: boolean;

  businessDomain?: string;
  businessTimezone?: string;
  aiPersonaInstructions?: string;
  
  autoVoiceToText?: boolean;
  sentimentAnalysis?: boolean;
  toxicityFilter?: boolean;
  
  defaultCurrency?: string;
  churnPrediction?: boolean;
  
  smartThrottling?: boolean;
  omniChannelMode?: boolean;
  
  autoSaveEnabled?: boolean;
  biometricExport?: boolean;
  e2eEncryption?: boolean;

  instaApiToken?: string;
  instaAccountId?: string;
  instaApiMode?: 'manual' | 'api';
  defaultTestTemplateId?: string;
  allowUnlimitedResources?: boolean;
}

export interface UploadedData {
  id: string;
  fileName: string;
  data: string;
  uploadedAt: string;
  ownerId?: string;
}

export interface WhatsappMessage {
  id: string;
  ownerId: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  type: string; // 'chat', 'image', 'video', 'document', etc.
  mediaUrl?: string;
  read?: boolean;
}

export const cleanupOldData = async () => {
  const user = auth.currentUser;
  if (!user) return;
  
  const lastCleanup = localStorage.getItem(`last_cleanup_${user.uid}`);
  const today = new Date().toDateString();
  if (lastCleanup === today) return; // Already cleaned up today
  
  localStorage.setItem(`last_cleanup_${user.uid}`, today);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const now = new Date().toISOString();
  
  const qData = query(
    collection(db, 'uploadedData'), 
    where('ownerId', '==', user.uid),
    where('uploadedAt', '<', sixMonthsAgo.toISOString())
  );

  const qInter = query(
    collection(db, 'interactions'),
    where('ownerId', '==', user.uid),
    where('expiresAt', '<', now)
  );
  
  try {
    const dataSnap = await getDocs(qData);
    const interSnap = await getDocs(qInter);

    if (dataSnap.size > 0 || interSnap.size > 0) {
      const docsToDelete = [...dataSnap.docs, ...interSnap.docs];
      // Use deleteInBatches helper
      const batchLimit = 200;
      for (let i = 0; i < docsToDelete.length; i += batchLimit) {
        const batch = writeBatch(db);
        const chunk = docsToDelete.slice(i, i + batchLimit);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        if (i + batchLimit < docsToDelete.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      console.log(`Cleaned up ${docsToDelete.length} old records.`);
    }
  } catch (error) {
    console.error("Error cleaning up old data:", error);
  }
};

const checkQuotaBeforeWrite = (action: string) => {
  if (isQuotaExceeded()) {
    throw new Error(`Quota Exceeded: ${action} temporarily disabled to protect your database. Free tier limit reached.`);
  }
};

export const addLead = async (lead: Omit<Lead, 'id' | 'ownerId'>): Promise<Lead> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Add Lead");
  
  const newLead: Lead = {
    ...lead,
    id: `LEAD-${uuidv4().substring(0, 8).toUpperCase()}`,
    ownerId: user.uid,
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'leads', newLead.id), newLead);
    return newLead;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'leads');
    throw error;
  }
};

export const updateLead = async (updatedLead: Lead) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (isQuotaExceeded()) throw new Error("Quota Exceeded: Cannot update lead.");
  
  try {
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(cleanObject);
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, cleanObject(v)])
        );
      }
      return obj;
    };
    const cleanLead = cleanObject(updatedLead);
    await updateDoc(doc(db, 'leads', updatedLead.id!), cleanLead);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leads/${updatedLead.id}`);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Delete Lead");
  try {
    await deleteDoc(doc(db, 'leads', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
  }
};

export const deleteLeadsBatch = async (ids: string[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  try {
    for (let i = 0; i < ids.length; i += 200) {
      const batch = writeBatch(db);
      const chunk = ids.slice(i, i + 200);
      chunk.forEach(id => batch.delete(doc(db, 'leads', id)));
      await batch.commit();
      if (i + 200 < ids.length) await new Promise(r => setTimeout(r, 500));
    }

    for (const id of ids) {
      const q = query(
        collection(db, 'conversions'), 
        where('leadId', '==', id),
        where('ownerId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await deleteInBatches(snapshot);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'leads_batch');
  }
};

export const updateLeadsBatchStatus = async (ids: string[], status: Lead['status']) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  try {
    for (let i = 0; i < ids.length; i += 200) {
      const batch = writeBatch(db);
      const chunk = ids.slice(i, i + 200);
      chunk.forEach(id => {
        const ref = doc(db, 'leads', id);
        batch.update(ref, { status, lastInteraction: new Date().toISOString() });
      });
      await batch.commit();
      if (i + 200 < ids.length) await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'leads_batch_status');
  }
};

export const deleteAllLeads = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  try {
    const qLead = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
    const snapLead = await getDocs(qLead);
    await deleteInBatches(snapLead);

    const qConv = query(collection(db, 'conversions'), where('ownerId', '==', user.uid));
    const snapConv = await getDocs(qConv);
    await deleteInBatches(snapConv);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_leads');
  }
};

export const addConversion = async (conversion: Omit<Conversion, 'id' | 'date' | 'ownerId'>): Promise<Conversion> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  checkQuotaBeforeWrite("Add Conversion");
  const newConversion: Conversion = {
    ...conversion,
    id: `CONV-${uuidv4().substring(0, 8).toUpperCase()}`,
    date: new Date().toISOString(),
    ownerId: user.uid,
  };
  try {
    await setDoc(doc(db, 'conversions', newConversion.id), newConversion);
    return newConversion;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'conversions');
    throw error;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  localStorage.setItem('allowUnlimitedResources', String(!settings.allowUnlimitedResources ? 'false' : 'true'));
  if (isQuotaExceeded()) throw new Error("Quota Exceeded: Writes temporarily disabled.");
  try {
    await setDoc(doc(db, 'settings', user.uid), { ...settings, ownerId: user.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
  }
};

export const saveUploadedData = async (fileName: string, data: any[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const id = `UPLOAD-${uuidv4().substring(0, 8).toUpperCase()}`;
  const upload: UploadedData = {
    id,
    fileName,
    data: JSON.stringify(data),
    uploadedAt: new Date().toISOString(),
    ownerId: user.uid,
  };
  try {
    await setDoc(doc(db, 'uploadedData', id), upload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'uploadedData');
  }
};

export const resetDatabase = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  console.log("Starting master database reset for user:", user.uid);
  try {
    console.log("Deleting leads and conversions...");
    await deleteAllLeads();

    console.log("Deleting interactions...");
    const qInter = query(collection(db, 'interactions'), where('ownerId', '==', user.uid));
    const snapInter = await getDocs(qInter);
    await deleteInBatches(snapInter);

    console.log("Deleting user settings...");
    await deleteDoc(doc(db, 'settings', user.uid));
    
    console.log("Master reset completed successfully.");
  } catch (error) {
    console.error("Error in resetDatabase:", error);
    throw error;
  }
};

export const resolveInteraction = async (id: string, notify: boolean = false) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await updateDoc(doc(db, 'interactions', id), { 
      status: 'Resolved'
    });

    if (notify) {
       // Logic to trigger WhatsApp/Instagram reply would go here
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `interactions/${id}`);
  }
};

export const updateInteraction = async (id: string, updates: Partial<Interaction>) => {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'interactions', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `interactions/${id}`);
  }
};

export const deleteInteraction = async (id: string) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  try {
    await deleteDoc(doc(db, 'interactions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `interactions/${id}`);
  }
};

export const subscribeToLeads = (callback: (leads: Lead[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'leads'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => doc.data() as Lead);
    callback(leads);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'leads');
  });
};

export const subscribeToInteractions = (callback: (interactions: Interaction[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'interactions'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    let interactions = snapshot.docs.map(doc => doc.data() as Interaction);
    interactions.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
    interactions = interactions.slice(0, 200);
    callback(interactions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'interactions');
  });
};

export const subscribeToConversions = (callback: (conversions: Conversion[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'conversions'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs.map(doc => doc.data() as Conversion);
    list.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
    list = list.slice(0, 200);
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'conversions');
  });
};

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'expenses'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs.map(doc => doc.data() as Expense);
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'ownerId'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const dRef = doc(collection(db, 'expenses'));
  const newRef: Expense = {
    ...expense,
    id: dRef.id,
    ownerId: user.uid,
  };
  await setDoc(dRef, newRef);
  return newRef.id;
};

export const deleteExpense = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await deleteDoc(doc(db, 'expenses', id));
};

export const subscribeToSocialAccounts = (callback: (accounts: SocialAccount[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'social_accounts'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as SocialAccount);
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'social_accounts');
  });
};

export const saveSocialAccount = async (account: SocialAccount) => {
  if (!auth.currentUser) throw new Error("Must be logged in");
  try {
    await setDoc(doc(db, 'social_accounts', account.id), {
      ...account,
      ownerId: auth.currentUser.uid
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'social_accounts');
  }
};

export const deleteSocialAccount = async (accountId: string) => {
  try {
    await deleteDoc(doc(db, 'social_accounts', accountId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'social_accounts');
  }
};

export const subscribeToCampaigns = (callback: (campaigns: MarketingCampaign[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'marketing_campaigns'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => doc.data() as MarketingCampaign);
    list.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'marketing_campaigns');
  });
};

export const saveCampaign = async (campaign: Partial<MarketingCampaign>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  if (!campaign.id) {
    campaign.id = `CAMP-${Date.now()}`;
  }
  
  campaign.ownerId = user.uid;
  if (!campaign.createdAt) campaign.createdAt = new Date().toISOString();
  
  await setDoc(doc(db, 'marketing_campaigns', campaign.id!), campaign);
};

export const deleteCampaign = async (id: string) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  await deleteDoc(doc(db, 'marketing_campaigns', id));
};

export const updateCampaignStatus = async (id: string, status: MarketingCampaign['status']) => {
  if (!auth.currentUser) throw new Error("Not authenticated");
  await updateDoc(doc(db, 'marketing_campaigns', id), { status });
};

export const subscribeToSettings = (callback: (settings: AppSettings | any) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  return onSnapshot(doc(db, 'settings', user.uid), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ businessName: "New Business" });
    }
  });
};

export const saveAutomationAuditLogEntry = async (log: Omit<AutomationAuditLog, 'id'>) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const q = collection(db, 'automation_audit');
    await addDoc(q, { ...log, ownerId: user.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'automation_audit');
  }
};

export const subscribeToUploadedData = (callback: (data: UploadedData[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'uploadedData'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as UploadedData);
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'uploadedData');
  });
};

export const subscribeToAutomationErrors = (callback: (errors: AutomationError[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, 'automation_errors'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const errorsList = snapshot.docs.map(d => d.data() as AutomationError);
    errorsList.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(errorsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'automation_errors');
  });
};

export const subscribeToReports = (callback: (reports: Report[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'reports'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => doc.data() as Report);
    reports.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'reports');
  });
};

export const addReport = async (report: Omit<Report, 'id'>) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...report,
      ownerId: user.uid,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { id: docRef.id });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reports');
  }
};

export const deleteReport = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'reports', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reports');
  }
};

export const subscribeToWhatsappMessages = (callback: (messages: WhatsappMessage[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, 'whatsapp_messages'), 
    where('ownerId', '==', user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    let messages = snapshot.docs.map(doc => doc.data() as WhatsappMessage);
    messages.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
    messages = messages.slice(0, 200);
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'whatsapp_messages');
  });
};

export const getChatbotSettings = async (): Promise<ChatbotSettings | null> => {
   const user = auth.currentUser;
   if (!user) return null;
   const d = await getDoc(doc(db, 'chatbot_settings', user.uid));
   return d.exists() ? d.data() as ChatbotSettings : null;
};

export const saveChatbotSettings = async (settings: ChatbotSettings) => {
   const user = auth.currentUser;
   if (!user) return;
   await setDoc(doc(db, 'chatbot_settings', user.uid), settings);
};

export const resolveAutomationError = async (id: string) => {
  try {
    await updateDoc(doc(db, 'automation_errors', id), { resolved: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'automation_errors');
  }
};

export const deleteInBatches = async (snapshot: any) => {
  const batchLimit = 200;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchLimit) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + batchLimit);
    chunk.forEach((docSnap: any) => batch.delete(docSnap.ref));
    await batch.commit();
    if (i + batchLimit < docs.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
};

export interface InventoryCategory {
  id: string;
  name: string;
  parentId?: string; // Null if it's a top-level category
  ownerId: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  specifications?: string;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  ownerId: string;
  createdAt: string;
  revenueGenerated?: number; // Total revenue from this item
  // Cost Saving & Intelligence
  costPrice?: number; // For profit margin calculations
  reorderLevel?: number; // Alert when stock drops below this
  turnoverVelocity?: 'Fast' | 'Medium' | 'Slow' | 'Dead'; // Speed of sales
}

export interface InventoryOrder {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  totalCost?: number;
  status: 'pending' | 'completed' | 'cancelled';
  ownerId: string;
  source?: string;
  createdAt: string;
}

export const subscribeToInventoryCategories = (callback: (cats: InventoryCategory[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'inventory_categories'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as InventoryCategory);
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(data);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory_categories'));
};

export const saveInventoryCategory = async (category: Partial<InventoryCategory>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!category.id) category.id = `CAT-${Date.now()}`;
  category.ownerId = user.uid;
  if (!category.createdAt) category.createdAt = new Date().toISOString();
  
  // Strip undefined values which Firestore doesn't support
  const cleanCategory = Object.fromEntries(Object.entries(category).filter(([_, v]) => v !== undefined));
  
  await setDoc(doc(db, 'inventory_categories', cleanCategory.id as string), cleanCategory);
};

export const deleteInventoryCategory = async (id: string) => {
  await deleteDoc(doc(db, 'inventory_categories', id));
  // Delete all items in this category
  const q = query(collection(db, 'inventory_items'), where('categoryId', '==', id));
  const snap = await getDocs(q);
  const batchRequests = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batchRequests);
};

export const subscribeToInventoryItems = (categoryId: string | null, callback: (items: InventoryItem[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  
  let q;
  if (categoryId) {
     q = query(collection(db, 'inventory_items'), where('ownerId', '==', user.uid), where('categoryId', '==', categoryId));
  } else {
     q = query(collection(db, 'inventory_items'), where('ownerId', '==', user.uid));
  }
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as InventoryItem);
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(data);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory_items'));
};

export const saveInventoryItem = async (item: Partial<InventoryItem>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!item.id) item.id = `ITEM-${Date.now()}`;
  item.ownerId = user.uid;
  if (!item.createdAt) item.createdAt = new Date().toISOString();
  
  // Strip undefined values
  const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
  
  await setDoc(doc(db, 'inventory_items', cleanItem.id as string), cleanItem);
};

export const deleteInventoryItem = async (id: string) => {
  await deleteDoc(doc(db, 'inventory_items', id));
};

export const subscribeToInventoryOrders = (callback: (orders: InventoryOrder[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'inventory_orders'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as InventoryOrder);
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(data);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory_orders'));
};

export const addInventoryOrder = async (order: Omit<InventoryOrder, 'id' | 'ownerId' | 'createdAt'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const dRef = doc(collection(db, 'inventory_orders'));
  const newOrder: InventoryOrder = {
    ...order,
    id: dRef.id,
    ownerId: user.uid,
    createdAt: new Date().toISOString()
  };
  await setDoc(dRef, newOrder);

  // We should also decrement the stock of the inventory item here if it's completed
  if (order.status === 'completed') {
    const itemRef = doc(db, 'inventory_items', order.itemId);
    const itemSnap = await getDoc(itemRef);
    if(itemSnap.exists()) {
      const currentStock = itemSnap.data().stock || 0;
      const currentRev = itemSnap.data().revenueGenerated || 0;
      await updateDoc(itemRef, {
        stock: Math.max(0, currentStock - order.quantity),
        revenueGenerated: currentRev + order.totalPrice
      });
    }
  }

  return newOrder.id;
};

export const saveInventoryOrder = async (order: Partial<InventoryOrder>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!order.id) order.id = `ORD-${Date.now()}`;
  order.ownerId = user.uid;
  if (!order.createdAt) order.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'inventory_orders', order.id), order);
};

export interface AgentModule {
  id: string;
  type: 'critical' | 'warning' | 'success';
  title: string;
  desc: string;
  btn1: string;
  btn2?: string;
  ownerId: string;
  createdAt: string;
}

export const subscribeToAgentModules = (callback: (modules: AgentModule[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'agent_modules'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as AgentModule);
    data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(data);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'agent_modules'));
};

export const saveAgentModule = async (module: Partial<AgentModule>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!module.id) module.id = `MOD-${Date.now()}`;
  module.ownerId = user.uid;
  if (!module.createdAt) module.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'agent_modules', module.id), module);
};

// -- Billing & Support Interfaces --

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate?: string;
  issuedAt: string;
  ownerId?: string;
  createdAt?: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  validUntil?: string;
  issuedAt: string;
  ownerId?: string;
  createdAt?: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  referenceNumber?: string;
  date: string;
  ownerId?: string;
  createdAt?: string;
}

export interface SupportTicket {
  id: string;
  customerId?: string;
  customerName?: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const subscribeToInvoices = (callback: (invoices: Invoice[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'invoices'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as Invoice).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'invoices'));
};

export const saveInvoice = async (invoice: Partial<Invoice>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!invoice.id) invoice.id = `INV-${Date.now()}`;
  invoice.ownerId = user.uid;
  if (!invoice.createdAt) invoice.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'invoices', invoice.id), invoice);
};

export const subscribeToQuotations = (callback: (quotations: Quotation[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'quotations'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as Quotation).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotations'));
};

export const saveQuotation = async (quotation: Partial<Quotation>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!quotation.id) quotation.id = `QUO-${Date.now()}`;
  quotation.ownerId = user.uid;
  if (!quotation.createdAt) quotation.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'quotations', quotation.id), quotation);
};

export const subscribeToPayments = (callback: (payments: Payment[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'payments'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as Payment).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));
};

export const savePayment = async (payment: Partial<Payment>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!payment.id) payment.id = `PAY-${Date.now()}`;
  payment.ownerId = user.uid;
  if (!payment.createdAt) payment.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'payments', payment.id), payment);
};

export const subscribeToTickets = (callback: (tickets: SupportTicket[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'tickets'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as SupportTicket).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));
};

export const saveTicket = async (ticket: Partial<SupportTicket>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!ticket.id) ticket.id = `TKT-${Date.now()}`;
  ticket.ownerId = user.uid;
  if (!ticket.createdAt) ticket.createdAt = new Date().toISOString();
  ticket.updatedAt = new Date().toISOString();
  await setDoc(doc(db, 'tickets', ticket.id), ticket);
};

export const deleteInvoice = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await deleteDoc(doc(db, 'invoices', id));
};

export const deleteQuotation = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await deleteDoc(doc(db, 'quotations', id));
};

export const deletePayment = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await deleteDoc(doc(db, 'payments', id));
};

export const deleteTicket = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await deleteDoc(doc(db, 'tickets', id));
};

export const deleteAgentModule = async (id: string) => {
  await deleteDoc(doc(db, 'agent_modules', id));
};

export const subscribeToForms = (callback: (forms: CustomForm[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(collection(db, 'forms'), where('ownerId', '==', user.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as CustomForm).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'forms'));
};

export const saveForm = async (form: Partial<CustomForm>) => {
  const user = auth.currentUser;
  if (!user) return;
  if (!form.id) form.id = `FORM-${Date.now()}`;
  form.ownerId = user.uid;
  if (!form.createdAt) form.createdAt = new Date().toISOString();
  await setDoc(doc(db, 'forms', form.id), form, { merge: true });

  // Automatically create a chatbot command for this form
  if (form.triggerWord) {
    const cmdId = `CMD-${form.id}`;
    const cmdParams: ChatbotCommand = {
      id: cmdId,
      triggerWord: form.triggerWord,
      response: `Please fill out the ${form.title} form here: \n${window.location.origin}/form/${form.id}?cid={customer_id}`,
      isActive: true,
      buttonLabel: 'Open Form',
      isForm: true,
      formId: form.id
    };
    
    // Update settings
    const botDoc = await getDoc(doc(db, 'chatbot_settings', user.uid));
    const botSettings = botDoc.exists() ? botDoc.data() : { commands: [] };
    const existingCommands = botSettings.commands || [];
    const commandIndex = existingCommands.findIndex((c: any) => c.id === cmdId);
    
    let updatedCommands;
    if (commandIndex >= 0) {
      updatedCommands = [...existingCommands];
      updatedCommands[commandIndex] = cmdParams;
    } else {
      updatedCommands = [...existingCommands, cmdParams];
    }
    
    await setDoc(doc(db, 'chatbot_settings', user.uid), { commands: updatedCommands }, { merge: true });
  }
};

export const deleteForm = async (id: string) => {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, 'forms', id));
  
  const botDoc = await getDoc(doc(db, 'chatbot_settings', user.uid));
  if (botDoc.exists()) {
    const botSettings = botDoc.data();
    const updatedCommands = (botSettings.commands || []).filter((c: any) => c.id !== `CMD-${id}`);
    await setDoc(doc(db, 'chatbot_settings', user.uid), { commands: updatedCommands }, { merge: true });
  }
};

