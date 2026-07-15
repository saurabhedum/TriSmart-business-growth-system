import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  X,
  Search,
  Filter,
  Users,
  IndianRupee,
  ChevronRight,
  Zap
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, updateDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Employee {
  id: string;
  name: string;
  role: string;
  branch: string;
}

interface Goal {
  id: string;
  employeeId: string;
  employeeName?: string;
  title: string;
  targetValue: number;
  currentValue: number;
  deadline: any;
  status: "Active" | "Achieved" | "Failed";
  ownerId: string;
}

interface Reward {
  id: string;
  employeeId: string;
  employeeName?: string;
  goalId: string;
  rewardAmount: number;
  description: string;
  awardedAt: any;
  ownerId: string;
}

export function RewardsView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "rewards" | "analytics">("goals");
  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);
  const [newReward, setNewReward] = useState({
    employeeId: "",
    goalId: "",
    rewardAmount: 0,
    description: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const qParams = [where("ownerId", "==", auth.currentUser.uid)];
      
      const [empSnap, goalSnap, rewardSnap] = await Promise.all([
        getDocs(query(collection(db, "employees"), ...qParams)),
        getDocs(query(collection(db, "goals"), ...qParams)),
        getDocs(query(collection(db, "rewards"), ...qParams, orderBy("awardedAt", "desc")))
      ]);

      const empData = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
      setEmployees(empData);

      const goalData = goalSnap.docs.map(doc => {
        const data = doc.data();
        const emp = empData.find(e => e.id === data.employeeId);
        return { id: doc.id, ...data, employeeName: emp?.name || "Unknown" };
      }) as Goal[];
      setGoals(goalData);

      const rewardData = rewardSnap.docs.map(doc => {
        const data = doc.data();
        const emp = empData.find(e => e.id === data.employeeId);
        return { id: doc.id, ...data, employeeName: emp?.name || "Unknown" };
      }) as Reward[];
      setRewards(rewardData);

    } catch (error) {
      console.error("Error fetching rewards data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "rewards"), {
        ...newReward,
        ownerId: auth.currentUser.uid,
        awardedAt: serverTimestamp()
      });
      
      // If a goal was linked, we could potentially mark it as rewarded or archived
      toast.success("Reward issued successfully!");
      setIsAddRewardModalOpen(false);
      setNewReward({ employeeId: "", goalId: "", rewardAmount: 0, description: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding reward:", error);
      toast.error("Failed to issue reward");
    }
  };

  const chartData = rewards.slice(0, 7).reverse().map(r => ({
    date: r.awardedAt?.toDate() ? r.awardedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending',
    amount: r.rewardAmount
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance & Rewards</h1>
          <p className="text-sm neu-text-muted mt-1">Track employee targets, celebrate achievements, and process incentives.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddRewardModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Issue Incentive
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neu-flat rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-[var(--accent)] font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--text-muted)]">Total Incentives</span>
          </div>
          <div className="text-2xl font-black">
            ₹{rewards.reduce((acc, r) => acc + r.rewardAmount, 0).toLocaleString()}
          </div>
          <div className="text-xs font-bold text-green-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Active rewards program
          </div>
        </div>

        <div className="neu-flat rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-blue-500 font-bold">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--text-muted)]">Active Targets</span>
          </div>
          <div className="text-2xl font-black">
            {goals.filter(g => g.status === "Active").length}
          </div>
          <div className="text-xs font-bold text-[var(--text-muted)] mt-1">
            Across {employees.length} team members
          </div>
        </div>

        <div className="neu-flat rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-green-500 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[var(--text-muted)]">Goals Strategy</span>
          </div>
          <div className="text-2xl font-black">
            {Math.round((goals.filter(g => g.status === "Achieved").length / (goals.length || 1)) * 100)}%
          </div>
          <div className="text-xs font-bold text-green-500 mt-1">Success rate</div>
        </div>

        <div className="neu-flat rounded-2xl p-5 bg-gradient-to-br from-[var(--accent)] to-indigo-600/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-white/80">Growth Velocity</span>
          </div>
          <div className="text-2xl font-black text-white">High</div>
          <div className="text-xs font-bold text-white/60 mt-1">Auto-calculation active</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 neu-pressed rounded-2xl w-fit">
        {[
          { id: "goals", label: "Active Targets", icon: Target },
          { id: "rewards", label: "Payout History", icon: IndianRupee },
          { id: "analytics", label: "Performance", icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-[var(--bg-color)] shadow-md text-[var(--accent)]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
           <div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "goals" && (
            <motion.div 
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {goals.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10">
                      <Target className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-main)]">No active targets</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                        Create a new target to get started.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="neu-flat rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{goal.title}</h3>
                        <p className="text-xs font-bold text-[var(--accent)] mt-1">{goal.employeeName}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        goal.status === "Achieved" ? "bg-green-500/10 text-green-500" :
                        goal.status === "Failed" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {goal.status}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-[var(--text-muted)]">Progress</span>
                          <span>{calculateProgress(goal)}%</span>
                       </div>
                       <div className="h-2 w-full neu-pressed rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress(goal)}%` }}
                            className={`h-full rounded-full ${
                              calculateProgress(goal) >= 100 ? "bg-green-500" : "bg-[var(--accent)]"
                            }`}
                          />
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--shadow-dark)]">
                       <div className="flex items-center gap-2 text-[var(--text-muted)]">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">₹{goal.currentValue} / ₹{goal.targetValue}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[var(--text-muted)]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">Expires: {goal.deadline?.toDate() ? goal.deadline.toDate().toLocaleDateString() : 'No date'}</span>
                       </div>
                    </div>

                    {goal.status === "Achieved" && (
                      <button 
                        onClick={() => {
                          setNewReward({ ...newReward, employeeId: goal.employeeId, goalId: goal.id });
                          setIsAddRewardModalOpen(true);
                        }}
                        className="w-full mt-2 py-2 bg-green-500 text-white rounded-xl text-xs font-bold shadow-lg hover:opacity-90"
                      >
                        Claim Reward
                      </button>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "rewards" && (
            <motion.div 
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="neu-flat rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--shadow-dark)]">
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--shadow-dark)]">
                    {rewards.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-[var(--text-muted)]">
                          No rewards processed yet.
                        </td>
                      </tr>
                    ) : (
                      rewards.map(reward => (
                        <tr key={reward.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full neu-pressed flex items-center justify-center text-xs font-black">
                                    {reward.employeeName?.charAt(0)}
                                 </div>
                                 <span className="font-bold text-sm">{reward.employeeName}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 font-black text-[var(--accent)]">₹{reward.rewardAmount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm font-medium text-[var(--text-muted)] truncate max-w-[200px]">{reward.description}</td>
                           <td className="px-6 py-4 text-sm font-bold">{reward.awardedAt?.toDate() ? reward.awardedAt.toDate().toLocaleDateString() : 'Pending'}</td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--accent)] hover:text-white">
                                 <ChevronRight className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div 
               key="analytics"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
               <div className="neu-flat rounded-2xl p-6">
                  <h3 className="font-black text-lg mb-6">Incentive Distribution (Recent)</h3>
                  <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <defs>
                              <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                           <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: 'var(--bg-color)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                             itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="amount" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="neu-flat rounded-2xl p-6">
                     <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--accent)]" />
                        Top Performers
                     </h3>
                     <div className="space-y-4">
                        {employees.slice(0, 4).map((emp, i) => (
                           <div key={emp.id} className="flex items-center justify-between p-3 neu-pressed rounded-xl">
                              <div className="flex items-center gap-3">
                                 <span className="text-xs font-black text-[var(--text-muted)] w-4">{i + 1}</span>
                                 <span className="font-bold text-sm">{emp.name}</span>
                              </div>
                              <span className="text-xs font-black text-[var(--accent)]">
                                 {goals.filter(g => g.employeeId === emp.id && g.status === "Achieved").length} Goals
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="neu-flat rounded-2xl p-6">
                     <h3 className="font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Needs Attention
                     </h3>
                     <div className="space-y-4">
                        {goals.filter(g => calculateProgress(g) < 20 && g.status === "Active").slice(0, 4).map(goal => (
                           <div key={goal.id} className="flex items-center justify-between p-3 neu-pressed rounded-xl border-l-4 border-orange-500">
                              <div>
                                 <p className="font-bold text-sm">{goal.employeeName}</p>
                                 <p className="text-[10px] text-[var(--text-muted)]">{goal.title}</p>
                              </div>
                              <span className="text-[10px] font-black text-orange-500">{calculateProgress(goal)}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Manual Reward Modal */}
      {isAddRewardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-md bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--shadow-dark)] overflow-hidden"
           >
              <div className="p-4 border-b border-[var(--shadow-dark)] flex items-center justify-between">
                <h3 className="font-bold text-lg">Send Incentive</h3>
                <button 
                  onClick={() => setIsAddRewardModalOpen(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddReward} className="p-4 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Select Employee</label>
                    <select 
                       value={newReward.employeeId}
                       onChange={e => setNewReward({...newReward, employeeId: e.target.value})}
                       className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                       required
                    >
                       <option value="">Choose Staff...</option>
                       {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Linked Goal (Optional)</label>
                    <select 
                       value={newReward.goalId}
                       onChange={e => setNewReward({...newReward, goalId: e.target.value})}
                       className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                    >
                       <option value="">Manual Reward (No Goal)</option>
                       {goals.filter(g => g.employeeId === newReward.employeeId).map(goal => (
                          <option key={goal.id} value={goal.id}>{goal.title}</option>
                       ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Amount (₹)</label>
                       <input 
                         type="number"
                         value={newReward.rewardAmount}
                         onChange={e => setNewReward({...newReward, rewardAmount: Number(e.target.value)})}
                         className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Incentive Type</label>
                       <select className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm">
                          <option>Performance Bonus</option>
                          <option>Sales Commission</option>
                          <option>Attendance Reward</option>
                          <option>Customer Favorite</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Description / Note</label>
                    <textarea 
                      value={newReward.description}
                      onChange={e => setNewReward({...newReward, description: e.target.value})}
                      className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm h-24 resize-none"
                      placeholder="Why a reward? (e.g., Sold 50 units in Downtown)"
                      required
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsAddRewardModalOpen(false)}
                      className="flex-1 py-3 neu-flat rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      Issue Now
                    </button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
}
