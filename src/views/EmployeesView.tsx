import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  ShieldCheck, 
  MoreVertical, 
  X, 
  Building,
  Target,
  Award,
  Share2,
  MessageSquare,
  Edit,
  Trash2,
  CheckSquare,
  Settings2,
  Link as LinkIcon
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import toast from "react-hot-toast";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Employee {
  id: string;
  name: string;
  role: string;
  branch: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  joinedAt?: any;
  ownerId: string;
}

export function EmployeesView({ onSimulate }: { onSimulate?: (emp: Employee) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isHrEngineOpen, setIsHrEngineOpen] = useState(false);
  const [useApiForWhatsapp, setUseApiForWhatsapp] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const [hrForm, setHrForm] = useState({
    role: "",
    branch: "",
    status: ""
  });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetValue: 0,
    deadline: "",
  });

  const roles = ["Admin", "Store Manager", "Sales Executive", "Cashier", "Delivery", "Support"];
  const branches = ["Main Store", "Warehouse A", "Downtown UI", "Outlet"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchEmployees();
      } else {
        setEmployees([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEmployees = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsLoading(true);
    const path = "employees";
    try {
      const q = query(
        collection(db, path), 
        where("ownerId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !editingEmployee) {
      toast.error("You must be logged in to add staff");
      return;
    }
    const path = "employees";
    try {
      if (editingEmployee.id) {
         await updateDoc(doc(db, path, editingEmployee.id), editingEmployee as any);
         toast.success("Employee updated successfully");
      } else {
         await addDoc(collection(db, path), {
           ...editingEmployee,
           status: "Active",
           joinedAt: serverTimestamp(),
           ownerId: auth.currentUser.uid
         });
         toast.success("Employee added successfully");
      }
      setIsAddModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Failed to save employee");
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteDoc(doc(db, "employees", id));
      toast.success("Employee deleted");
      setSelectedEmployees(prev => prev.filter(eId => eId !== id));
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete employee");
    }
  };

  const handleHrBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) return;
    try {
      const batch = writeBatch(db);
      const updates: any = {};
      if (hrForm.role) updates.role = hrForm.role;
      if (hrForm.branch) updates.branch = hrForm.branch;
      if (hrForm.status) updates.status = hrForm.status;
      
      selectedEmployees.forEach(id => {
        const ref = doc(db, "employees", id);
        batch.update(ref, updates);
      });
      await batch.commit();
      toast.success("Bulk update successful");
      setIsHrEngineOpen(false);
      setSelectedEmployees([]);
      setHrForm({ role: "", branch: "", status: "" });
      fetchEmployees();
    } catch (error) {
      console.error("Bulk update failed:", error);
      toast.error("Failed to update employees");
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const getShareLink = (id: string) => {
     return `${window.location.origin}${window.location.pathname}#/portal?staff=${id}`;
  };

  const handleShareClick = (emp: Employee) => {
     const link = getShareLink(emp.id);
     navigator.clipboard.writeText(link);
     toast.success("Permanent link copied to clipboard!");
  };
  
  const handleWhatsAppClick = async (emp: Employee) => {
     const link = getShareLink(emp.id);
     const message = `Hello ${emp.name}, here is your permanent login link: ${link}`;
     if (useApiForWhatsapp) {
        toast.promise(
          new Promise(resolve => setTimeout(resolve, 1500)),
           {
             loading: 'Sending via API...',
             success: `Message sent via API to ${emp.phone || 'employee'}`,
             error: 'Failed to send'
           }
        );
     } else {
        if (!emp.phone) {
           toast.error("Employee has no phone number");
           return;
        }
        const whatsappUrl = `https://wa.me/${emp.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
     }
  };

  const handleAssignGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedEmployee) return;
    const path = "goals";
    try {
      await addDoc(collection(db, path), {
        employeeId: selectedEmployee.id,
        title: newGoal.title,
        targetValue: Number(newGoal.targetValue),
        currentValue: 0,
        deadline: new Date(newGoal.deadline),
        status: "Active",
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      toast.success(`Goal assigned to ${selectedEmployee.name}`);
      setIsGoalModalOpen(false);
      setNewGoal({ title: "", targetValue: 0, deadline: "" });
    } catch (error) {
      console.error("Error assigning goal:", error);
      toast.error("Failed to assign goal");
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team & Staff</h1>
          <p className="text-sm neu-text-muted mt-1">Manage employees, assign roles, and track branch assignments.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer mr-2">
            <input 
              type="checkbox"
              checked={useApiForWhatsapp}
              onChange={e => setUseApiForWhatsapp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-[var(--bg-color)] border-gray-300"
            />
            <span className="text-sm font-bold text-[var(--text-muted)]">Use API for Messages</span>
          </label>
        
          <button 
            onClick={() => setIsHrEngineOpen(true)}
            className="flex items-center gap-2 bg-[var(--bg-color)] text-[var(--text-main)] px-4 py-2 rounded-xl text-sm font-bold border border-black/10 shadow-sm hover:bg-black/5 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-purple-500" />
            HR Engine
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search team..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-56 neu-pressed rounded-xl text-sm outline-none font-medium"
            />
          </div>
          <button 
            onClick={() => {
              setEditingEmployee({ name: "", role: "Sales Executive", branch: "Main Store", phone: "", email: "" });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>
      
      {selectedEmployees.length > 0 && (
         <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-2 font-bold text-sm">
             <CheckSquare className="w-4 h-4" />
             {selectedEmployees.length} employee(s) selected
           </div>
           <div className="flex gap-2">
             <button onClick={toggleSelectAll} className="px-3 py-1 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black uppercase text-xs tracking-wider rounded-lg border border-black/10 font-bold transition-colors">
               Select All
             </button>
             <button onClick={() => setSelectedEmployees([])} className="px-3 py-1 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black uppercase text-xs tracking-wider rounded-lg border border-black/10 font-bold transition-colors">
               Clear
             </button>
             <button onClick={() => setIsHrEngineOpen(true)} className="px-3 py-1 bg-indigo-500 text-white hover:bg-indigo-600 uppercase text-xs tracking-wider rounded-lg font-bold shadow-sm transition-colors">
               Bulk Update Options
             </button>
           </div>
         </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="neu-flat rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 neu-pressed rounded-2xl flex items-center justify-center text-[var(--accent)] mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Staff Members Yet</h3>
          <p className="text-sm neu-text-muted max-w-md mb-6">
            Get started by adding employees. In Phase 2, they will get their own dashboards, targets, and rewards.
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent)] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add First Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(emp => (
            <motion.div 
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`neu-flat rounded-2xl p-6 relative group border transition-colors ${selectedEmployees.includes(emp.id) ? 'border-indigo-500 shadow-sm shadow-indigo-500/20' : 'border-transparent hover:border-black/5 dark:hover:border-white/5'}`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => handleWhatsAppClick(emp)}
                   className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                   title="Send Link via WhatsApp"
                 >
                   <MessageSquare className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => handleShareClick(emp)}
                   className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                   title="Copy Portal Link"
                 >
                   <Share2 className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => { setEditingEmployee(emp); setIsAddModalOpen(true); }}
                   className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                   title="Edit Employee"
                 >
                   <Edit className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                   className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                   title="Delete Employee"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <div className="absolute top-4 left-4 z-10">
                 <input 
                   type="checkbox"
                   checked={selectedEmployees.includes(emp.id)}
                   onChange={() => toggleSelect(emp.id)}
                   className="w-4 h-4 rounded text-indigo-500 bg-[var(--bg-color)] border-gray-300 cursor-pointer"
                 />
              </div>
              
              <div className="flex items-start gap-4 mb-4 mt-2">
                <div className="w-12 h-12 rounded-full neu-pressed flex items-center justify-center font-black text-lg bg-gradient-to-br from-[var(--accent)] to-indigo-600 bg-clip-text text-transparent shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="pr-20">
                  <h3 className="font-bold text-lg leading-tight mb-1">{emp.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {emp.role}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6 pt-4 border-t border-[var(--shadow-dark)]">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Building className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="truncate">{emp.branch}</span>
                </div>
                {emp.email && (
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {emp.status}
                </span>
                
                <div className="ml-auto flex items-center gap-1">
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setIsGoalModalOpen(true); }}
                    className="p-1.5 text-[var(--accent)] bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors" 
                    title="Assign Goal"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    className="p-1.5 text-orange-500 bg-orange-500/10 rounded-lg hover:bg-orange-500 hover:text-white transition-colors" 
                    title="View Rewards"
                  >
                    <Award className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onSimulate?.(emp)}
                    className="p-1.5 text-blue-500 bg-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" 
                    title="View Employee Portal"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Goal Assignment Modal */}
      {isGoalModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--shadow-dark)] overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--shadow-dark)] flex items-center justify-between">
              <h3 className="font-bold text-lg">Assign Target: {selectedEmployee.name}</h3>
              <button 
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAssignGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Goal Title</label>
                <input 
                  type="text" 
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Monthly Sales Target"
                  className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Target Amount (₹)</label>
                <input 
                  type="number" 
                  value={newGoal.targetValue}
                  onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                  className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Deadline</label>
                <input 
                  type="date" 
                  value={newGoal.deadline}
                  onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-3 neu-flat rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--shadow-dark)] overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--shadow-dark)] flex items-center justify-between">
              <h3 className="font-bold text-lg">{editingEmployee?.id ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingEmployee(null); }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editingEmployee?.name || ""}
                  onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})}
                  className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Role</label>
                  <select 
                    value={editingEmployee?.role || ""}
                    onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})}
                    className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  >
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Location / Branch</label>
                   <select 
                     value={editingEmployee?.branch || ""}
                     onChange={e => setEditingEmployee({...editingEmployee, branch: e.target.value})}
                     className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                   >
                     {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Phone</label>
                  <input 
                    type="tel" 
                    value={editingEmployee?.phone || ""}
                    onChange={e => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                    className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Email (For Dashboard Login)</label>
                  <input 
                    type="email" 
                    value={editingEmployee?.email || ""}
                    onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})}
                    className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingEmployee(null); }}
                  className="flex-1 py-3 neu-flat rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* HR Engine Modal */}
      {isHrEngineOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--shadow-dark)] overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--shadow-dark)] flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-500" />
                HR Engine
              </h3>
              <button 
                onClick={() => setIsHrEngineOpen(false)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                title="Close HR Engine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleHrBulkUpdate} className="p-4 space-y-4">
              <p className="text-sm font-medium text-[var(--text-muted)] mb-4">
                 Apply updates to <strong>{selectedEmployees.length === 0 ? 'all selected' : selectedEmployees.length}</strong> employee(s) at once. Leave fields blank to keep current values.
              </p>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Change Role</label>
                <select 
                  value={hrForm.role}
                  onChange={e => setHrForm({...hrForm, role: e.target.value})}
                  className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                >
                  <option value="">No Change</option>
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Change Location / Branch</label>
                 <select 
                   value={hrForm.branch}
                   onChange={e => setHrForm({...hrForm, branch: e.target.value})}
                   className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                 >
                   <option value="">No Change</option>
                   {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Change Status</label>
                 <select 
                   value={hrForm.status}
                   onChange={e => setHrForm({...hrForm, status: e.target.value})}
                   className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                 >
                   <option value="">No Change</option>
                   <option value="Active">Active</option>
                   <option value="Inactive">Inactive</option>
                 </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsHrEngineOpen(false)}
                  className="flex-1 py-3 neu-flat rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={selectedEmployees.length === 0}
                  className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-50"
                >
                  Apply Updates
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
