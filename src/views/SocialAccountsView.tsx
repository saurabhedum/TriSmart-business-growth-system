import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Instagram,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Shield,
  Trash2,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Key,
  Monitor,
  Activity,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import {
  saveSocialAccount,
  deleteSocialAccount,
  SocialAccount,
  saveSettings,
} from "../lib/db";
import { auth } from "../firebase";
import { toast } from "react-hot-toast";

export function SocialAccountsView() {
  const { socialAccounts, settings } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showConnectModal, setShowConnectModal] = useState<
    false | "Instagram" | "WhatsApp"
  >(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    title: string;
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const handleConnect = async (platform: "Instagram" | "WhatsApp") => {
    setIsConnecting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setFeedbackMsg({
          title: "Authentication Error",
          msg: "You must be logged in to connect accounts.",
          type: "error",
        });
        setIsConnecting(false);
        return;
      }

      if (platform === "WhatsApp") {
        if (!settings?.whatsappApiToken || !settings?.whatsappPhoneId) {
          setFeedbackMsg({
            title: "Missing Credentials",
            msg: "Please configure WhatsApp API Token and Phone Number ID in Settings first.",
            type: "error",
          });
          setIsConnecting(false);
          return;
        }

        const res = await fetch(
          `https://graph.facebook.com/v18.0/${settings.whatsappPhoneId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${settings.whatsappApiToken}`,
            },
          },
        );

        if (!res.ok) {
          const data = await res.json();
          setFeedbackMsg({
            title: "Connection Failed",
            msg: `Live WhatsApp API error: ${data.error?.message || "Unauthorized or invalid token"}`,
            type: "error",
          });
          setIsConnecting(false);
          return;
        }
      } else if (platform === "Instagram") {
        if (!settings?.instaApiToken || !settings?.instaAccountId) {
          setFeedbackMsg({
            title: "Missing Credentials",
            msg: "Please configure Instagram Account ID and API Token in Settings first.",
            type: "error",
          });
          setIsConnecting(false);
          return;
        }
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${encodeURIComponent(settings.instaAccountId || "")}?fields=id,username,name&access_token=${encodeURIComponent(settings.instaApiToken || "")}`,
        );
        if (!res.ok) {
          const data = await res.json();
          setFeedbackMsg({
            title: "Connection Failed",
            msg: `Live Instagram API error: ${data.error?.message || "Unauthorized or invalid token"}`,
            type: "error",
          });
          setIsConnecting(false);
          return;
        }
      }

      const newId = `SOC-${Date.now()}`;
      const newAcc: SocialAccount = {
        id: newId,
        ownerId: user.uid,
        platform: platform,
        accountName: `${platform} Business Live`,
        accountId:
          platform === "WhatsApp"
            ? settings?.whatsappPhoneId || ""
            : settings?.instaAccountId || "",
        status: "Active",
        accessToken: "managed-via-settings",
        createdAt: new Date().toISOString(),
      };
      await saveSocialAccount(newAcc);
      setShowConnectModal(false);
      setFeedbackMsg({
        title: "Connection Successful",
        msg: `Your ${platform} account is now actively linked to Omniverse.`,
        type: "success",
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (e: any) {
      setFeedbackMsg({
        title: "Connection Failed",
        msg:
          e.message ||
          "An error occurred while establishing secure connection.",
        type: "error",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredAccounts = socialAccounts.filter(
    (acc) =>
      acc.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 relative">
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${feedbackMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"}`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest">
                {feedbackMsg.title}
              </h4>
              <p className="text-[10px] font-bold opacity-80">
                {feedbackMsg.msg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
            Social Accounts
          </h1>
          <p className="text-xs neu-text-muted font-bold max-w-lg leading-relaxed uppercase tracking-tight opacity-70">
            Connect your Instagram and WhatsApp accounts to start capturing
            leads and launching campaigns.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConnectModal("Instagram")}
            className="w-full sm:w-auto px-6 py-4 neu-flat !bg-rose-500/10 !text-rose-500 hover:!bg-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-colors"
          >
            <Instagram className="w-4 h-4" /> Connect Instagram
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConnectModal("WhatsApp")}
            className="w-full sm:w-auto px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 flex items-center justify-center gap-3 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Connect WhatsApp
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search connected channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-xs font-bold uppercase tracking-wider"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={async () => {
              if (settings) {
                try {
                  await saveSettings(settings);
                  toast.success("Changes saved successfully!");
                } catch (err: any) {
                  toast.error("Failed to save changes: " + (err.message || ""));
                }
              } else {
                toast.error("Settings not loaded.");
              }
            }}
            className="w-full md:w-auto px-6 py-4 neu-flat rounded-xl text-neutral-500 hover:text-accent transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Save Changes
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAccounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-24 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">No channels joined</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    Bridge your Instagram and WhatsApp accounts to start leveraging automated marketing.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            filteredAccounts.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <Card className="border-none rounded-3xl neu-flat hover:shadow-2xl hover:shadow-accent/[0.05] transition-all overflow-hidden flex flex-col h-full">
                  <CardHeader className="bg-[var(--shadow-dark)]/10 p-6 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl neu-flat ${acc.platform === "WhatsApp" ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {acc.platform === "WhatsApp" ? (
                          <MessageCircle className="w-5 h-5" />
                        ) : (
                          <Instagram className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">
                          {acc.accountName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${acc.status === "Active" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}
                          />
                          <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                            {acc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSocialAccount(acc.id)}
                      className="p-2 neu-pressed rounded-xl text-neutral-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-3 text-[10px] font-bold">
                      <div className="flex items-center justify-between">
                        <span className="neu-text-muted uppercase tracking-widest">
                          Account Node ID
                        </span>
                        <span className="text-accent font-mono text-xs">{acc.accountId || "No ID Available"}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-black/[0.03] pt-2">
                        <span className="neu-text-muted uppercase tracking-widest">
                          Binding Type
                        </span>
                        <span className="text-accent uppercase">{acc.platform} Graph Integration</span>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-4 border-t border-black/[0.05]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                        Meta Webhook Configuration
                      </div>
                      <div
                        className="p-3 neu-pressed rounded-xl text-[10px] sm:text-xs font-mono text-neutral-600 break-all bg-white/50 user-select-all mb-2 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/${acc.platform.toLowerCase()}-webhook/${auth.currentUser?.uid}`,
                          );
                          toast.success("Webhook URL copied!");
                        }}
                      >
                        <span className="font-bold text-accent">URL:</span>{" "}
                        {window.location.origin}/api/
                        {acc.platform.toLowerCase()}-webhook/
                        {auth.currentUser?.uid || "{user-id}"}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Verify Token (e.g. my-secret-token)"
                          value={
                            acc.platform === "WhatsApp"
                              ? settings?.whatsappVerifyToken || ""
                              : settings?.instagramVerifyToken || ""
                          }
                          onChange={async (e) => {
                            if (!settings) return;
                            const key =
                              acc.platform === "WhatsApp"
                                ? "whatsappVerifyToken"
                                : "instagramVerifyToken";
                            try {
                              await saveSettings({
                                ...settings,
                                [key]: e.target.value,
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex-1 p-3 neu-pressed rounded-xl text-xs font-bold outline-none bg-transparent"
                        />
                        <button
                          onClick={async () => {
                            let toastId;
                            try {
                              const token =
                                acc.platform === "WhatsApp"
                                  ? settings?.whatsappVerifyToken || ""
                                  : settings?.instagramVerifyToken || "";
                              if (!token) {
                                toast.error(
                                  "Please enter a verify token first.",
                                );
                                return;
                              }
                              const testChallenge =
                                "test_challenge_" +
                                Math.floor(Math.random() * 1000000);
                              const url = `${window.location.origin}/api/${acc.platform.toLowerCase()}-webhook/${auth.currentUser?.uid}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=${testChallenge}`;

                              // Show a loading toast
                              toastId = toast.loading("Pinging webhook...");

                              const req = await fetch(url);
                              if (req.ok) {
                                const text = await req.text();
                                if (text === testChallenge) {
                                  toast.success(
                                    "Webhook connection test verified locally! Now try in Meta Dashboard.",
                                    { id: toastId },
                                  );
                                } else {
                                  toast.error(
                                    "Webhook reachable but responded with invalid challenge: " +
                                      text,
                                    { id: toastId },
                                  );
                                }
                              } else {
                                toast.error(
                                  `Webhook failed with status: ${req.status} ${req.statusText}`,
                                  { id: toastId },
                                );
                              }
                            } catch (e: any) {
                              toast.error(
                                "Failed to ping webhook: " + (e.message || ""),
                                { id: toastId },
                              );
                            }
                          }}
                          className="px-4 py-3 neu-flat rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-accent transition-colors flex items-center justify-center whitespace-nowrap"
                        >
                          Test locally
                        </button>
                      </div>
                      <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">
                        IMPORTANT: Click "SAVE CHANGES" at the top before
                        verifying in Meta Dashboard.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() =>
                          setFeedbackMsg({
                            title: "Navigation Notice",
                            msg: "Please configure API keys directly inside the Settings > API Integrations panel.",
                            type: "error",
                          })
                        }
                        className="w-full py-4 neu-pressed rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-accent transition-all"
                      >
                        <Key className="w-4 h-4" /> Manage API Tokens
                      </button>
                    </div>

                    {acc.platform === "WhatsApp" && (
                      <div className="mt-4 space-y-2 pt-4 border-t border-black/[0.05]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                          Test Live API
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            id={`test-phone-${acc.id}`}
                            type="text"
                            placeholder="Phone w/ Country Code (e.g. 15551234567)"
                            className="flex-1 p-3 neu-pressed rounded-xl text-xs font-bold outline-none bg-transparent"
                          />
                          <button
                            onClick={async () => {
                              const phoneInput = document.getElementById(
                                `test-phone-${acc.id}`,
                              ) as HTMLInputElement;
                              const toPhone = phoneInput?.value?.replace(
                                /\D/g,
                                "",
                              );
                              if (!toPhone) {
                                toast.error(
                                  "Please enter a valid phone number.",
                                );
                                return;
                              }
                              if (
                                !settings?.whatsappApiToken ||
                                !settings?.whatsappPhoneId
                              ) {
                                toast.error(
                                  "Missing WhatsApp API Token or Phone ID in Settings.",
                                );
                                return;
                              }
                              const toastId = toast.loading(
                                `Sending test message to ${toPhone}...`,
                              );
                              try {
                                const res = await fetch(
                                  `https://graph.facebook.com/v18.0/${settings.whatsappPhoneId}/messages`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${settings.whatsappApiToken}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      messaging_product: "whatsapp",
                                      recipient_type: "individual",
                                      to: toPhone,
                                      type: "text",
                                      text: {
                                        body: "Hello! This is a test message from Omniverse API integration.",
                                      },
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  toast.success(
                                    "Test message sent successfully!",
                                    { id: toastId },
                                  );
                                  if (phoneInput) phoneInput.value = "";
                                } else {
                                  const errorData = await res.json();
                                  toast.error(
                                    `API Error: ${errorData.error?.message || "Failed to send message"}`,
                                    { id: toastId },
                                  );
                                }
                              } catch (err: any) {
                                toast.error("Network error: " + err.message, {
                                  id: toastId,
                                });
                              }
                            }}
                            className="px-4 py-3 neu-flat rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center whitespace-nowrap"
                          >
                            Send Test
                          </button>
                        </div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">
                          Sends a test text to verify Graph API message
                          delivery status.
                        </p>
                      </div>
                    )}

                    {acc.platform === "Instagram" && (
                      <div className="mt-4 space-y-2 pt-4 border-t border-black/[0.05]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                          Test Live API
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            id={`test-instagram-${acc.id}`}
                            type="text"
                            placeholder="Instagram User ASID (e.g. 1234567)"
                            className="flex-1 p-3 neu-pressed rounded-xl text-xs font-bold outline-none bg-transparent"
                          />
                          <button
                            onClick={async () => {
                              const igInput = document.getElementById(
                                `test-instagram-${acc.id}`,
                              ) as HTMLInputElement;
                              const recipientId = igInput?.value?.trim();
                              if (!recipientId) {
                                toast.error(
                                  "Please enter a valid Instagram User ASID.",
                                );
                                return;
                              }
                              if (
                                !settings?.instaApiToken ||
                                !settings?.instaAccountId
                              ) {
                                toast.error(
                                  "Missing Instagram API Token or Account ID in Settings.",
                                );
                                return;
                              }
                              const toastId = toast.loading(
                                `Sending test Instagram DM to ${recipientId}...`,
                              );
                              try {
                                const payload = {
                                  recipient: { id: recipientId },
                                  message: {
                                    text: "Hello! This is a test message from Omniverse Instagram API integration.",
                                  },
                                };
                                let res = await fetch(
                                  `https://graph.facebook.com/v18.0/${settings.instaAccountId ? encodeURIComponent(settings.instaAccountId) : "me"}/messages?access_token=${encodeURIComponent(settings.instaApiToken)}`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(payload),
                                  },
                                );
                                let errorData;
                                if (!res.ok) {
                                  errorData = await res.json();
                                  // Fallback to ID-based endpoint if 'me' fails due to Page vs User token ambiguity
                                  if (errorData.error?.message?.includes("Object with ID 'me' does not exist") && settings.instaAccountId) {
                                    toast.loading("Retrying DM request using specific Instagram Account ID...", { id: toastId });
                                    res = await fetch(
                                      `https://graph.facebook.com/v18.0/${encodeURIComponent(settings.instaAccountId)}/messages?access_token=${encodeURIComponent(settings.instaApiToken)}`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(payload),
                                      },
                                    );
                                    if (!res.ok) {
                                      errorData = await res.json();
                                    }
                                  }
                                }

                                if (res.ok) {
                                  toast.success(
                                    "Test DM sent successfully!",
                                    { id: toastId },
                                  );
                                  if (igInput) igInput.value = "";
                                } else {
                                  const errorMsg = errorData?.error?.message || "Failed to send message";
                                  if (errorMsg.includes("Object with ID 'me' does not exist") || errorMsg.includes("permissions") || errorMsg.includes("Unsupported post request")) {
                                    toast.error(
                                      "Configuration Alert: Please ensure you are utilizing a Facebook PAGE Access Token (with 'pages_messaging' and 'instagram_manage_messages' permissions) rather than a User access token.",
                                      { id: toastId, duration: 10000 }
                                    );
                                  } else {
                                    toast.error(
                                      `API Error: ${errorMsg}`,
                                      { id: toastId },
                                    );
                                  }
                                }
                              } catch (err: any) {
                                toast.error("Network error: " + err.message, {
                                  id: toastId,
                                });
                              }
                            }}
                            className="px-4 py-3 neu-flat rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors flex items-center justify-center whitespace-nowrap"
                          >
                            Send Test
                          </button>
                        </div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">
                          Sends a test DM to verify Instagram DM Message Delivery.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm p-8 bg-[var(--bg-color)] rounded-3xl shadow-2xl relative overflow-hidden text-center"
            >
              <button
                onClick={() => setShowConnectModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors absolute-glow z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div
                className={`w-16 h-16 mx-auto rounded-2xl neu-flat flex items-center justify-center mb-6 ${showConnectModal === "WhatsApp" ? "text-emerald-500" : "text-rose-500"}`}
              >
                {showConnectModal === "WhatsApp" ? (
                  <MessageCircle className="w-8 h-8" />
                ) : (
                  <Instagram className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                Connect {showConnectModal}
              </h3>
              <p className="text-[10px] font-bold neu-text-muted leading-relaxed uppercase tracking-widest mb-8">
                Securely hook your {showConnectModal} business account into the
                Omniverse framework via secure API.
              </p>
              <button
                onClick={() => handleConnect(showConnectModal)}
                disabled={isConnecting}
                className={`w-full py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex justify-center items-center gap-2 transition-all ${showConnectModal === "WhatsApp" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"} disabled:opacity-50`}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {isConnecting
                  ? "Establishing Handshake..."
                  : "Authorize Integration"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
