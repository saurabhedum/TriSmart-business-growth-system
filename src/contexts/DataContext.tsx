import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { 
  Lead, 
  AppSettings, 
  Conversion, 
  Interaction, 
  Report, 
  WhatsappMessage, 
  AutomationError,
  SocialAccount,
  MarketingCampaign,
  subscribeToLeads,
  subscribeToSettings,
  subscribeToInteractions,
  subscribeToReports,
  subscribeToWhatsappMessages,
  subscribeToAutomationErrors,
  subscribeToConversions,
  subscribeToSocialAccounts,
  subscribeToCampaigns,
  InventoryItem,
  subscribeToInventoryItems,
  InventoryOrder,
  subscribeToInventoryOrders,
  Invoice,
  Quotation,
  Payment,
  SupportTicket,
  subscribeToInvoices,
  subscribeToQuotations,
  subscribeToPayments,
  subscribeToTickets,
  subscribeToExpenses,
  MessageTemplate,
  subscribeToTemplates,
  Expense,
  CustomForm,
  subscribeToForms
} from '../lib/db';

interface DataContextType {
  leads: Lead[];
  settings: AppSettings | null;
  conversions: Conversion[];
  expenses: Expense[];
  interactions: Interaction[];
  templates: MessageTemplate[];
  reports: Report[];
  messages: WhatsappMessage[];
  automationErrors: AutomationError[];
  socialAccounts: SocialAccount[];
  campaigns: MarketingCampaign[];
  inventoryItems: InventoryItem[];
  inventoryOrders: InventoryOrder[];
  invoices: Invoice[];
  quotations: Quotation[];
  payments: Payment[];
  tickets: SupportTicket[];
  forms: CustomForm[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [automationErrors, setAutomationErrors] = useState<AutomationError[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryOrders, setInventoryOrders] = useState<InventoryOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const clearSubscriptions = () => {
      unsubs.forEach(unsub => unsub());
      unsubs = [];
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        clearSubscriptions();
        unsubs.push(subscribeToLeads(setLeads));
        unsubs.push(subscribeToSettings(setSettings));
        unsubs.push(subscribeToInteractions(setInteractions));
        unsubs.push(subscribeToTemplates(setTemplates));
        unsubs.push(subscribeToReports(setReports));
        unsubs.push(subscribeToWhatsappMessages(setMessages));
        unsubs.push(subscribeToAutomationErrors(setAutomationErrors));
        unsubs.push(subscribeToConversions(setConversions));
        unsubs.push(subscribeToExpenses(setExpenses));
        unsubs.push(subscribeToSocialAccounts(setSocialAccounts));
        unsubs.push(subscribeToCampaigns(setCampaigns));
        unsubs.push(subscribeToInventoryItems(null, setInventoryItems)); // Get all items
        unsubs.push(subscribeToInventoryOrders(setInventoryOrders));
        unsubs.push(subscribeToInvoices(setInvoices));
        unsubs.push(subscribeToQuotations(setQuotations));
        unsubs.push(subscribeToPayments(setPayments));
        unsubs.push(subscribeToTickets(setTickets));
        unsubs.push(subscribeToForms(setForms));

        setIsLoading(false);
      } else {
        clearSubscriptions();
        setLeads([]);
        setSettings(null);
        setConversions([]);
        setExpenses([]);
        setInteractions([]);
        setTemplates([]);
        setReports([]);
        setMessages([]);
        setAutomationErrors([]);
        setSocialAccounts([]);
        setCampaigns([]);
        setInventoryItems([]);
        setInventoryOrders([]);
        setInvoices([]);
        setQuotations([]);
        setPayments([]);
        setTickets([]);
        setForms([]);
        setIsLoading(false);
      }
    });

    return () => {
      clearSubscriptions();
      unsubAuth();
    };
  }, []);

  return (
    <DataContext.Provider value={{
      leads,
      settings,
      conversions,
      expenses,
      interactions,
      templates,
      reports,
      messages,
      automationErrors,
      socialAccounts,
      campaigns,
      inventoryItems,
      inventoryOrders,
      invoices,
      quotations,
      payments,
      tickets,
      forms,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
