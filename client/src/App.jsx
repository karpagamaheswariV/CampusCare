import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BarChart3, Bell, Building2, CheckCircle2, ChevronRight, ClipboardList, Clock3,
  FileText, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, TrendingUp,
  UserRound, Users, Wrench, X, MapPin, AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from './api';

const categories = ['Electrical problems','Plumbing and water supply','Internet and Wi-Fi','Classroom maintenance','Laboratory equipment','Hostel facilities','Cleanliness and sanitation','Furniture damage','Library facilities','Security issues','Transportation','Other'];
const colors = ['#2563eb','#14b8a6','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

function useAuth() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('campus_user') || 'null'));
  return user;
}
function logout(navigate) {
  localStorage.removeItem('campus_token');
  localStorage.removeItem('campus_user');
  navigate('/login');
}

function Landing() {
  return <div className="landing">
    <nav><div className="brand"><div className="brand-mark"><Building2 size={22}/></div>Campus<span>Care</span></div><div className="nav-actions"><Link to="/login" className="btn ghost">Sign in</Link><Link to="/register" className="btn primary">Create account</Link></div></nav>
    <main className="hero">
      <div><span className="eyebrow">SMART CAMPUS SERVICES</span><h1>Every campus issue,<br/><em>resolved faster.</em></h1><p>Report, track and resolve campus problems from one transparent platform.</p><div className="hero-actions"><Link to="/register" className="btn primary large">Submit a complaint <ChevronRight size={18}/></Link><Link to="/login" className="btn outline large">View dashboard</Link></div></div>
      <div className="hero-visual"><div className="visual-card"><div className="visual-header"><span>Campus overview</span><span className="live-dot">Live</span></div><div className="mini-kpis"><div><b>248</b><span>Total complaints</span></div><div><b>92%</b><span>Resolution rate</span></div></div><div className="trend-bars">{[42,58,44,72,64,88,76,92,68,82].map((h,i)=><i key={i} style={{height:h+'%'}}/> )}</div></div></div>
    </main>
  </div>;
}

function AuthPage({ mode='login' }) {
  const [form,setForm] = useState({ name:'',email:'',password:'',registerNumber:'',department:'',year:'',phone:'',resetToken:'',newPassword:'' });
  const [loading,setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const url = mode === 'register' ? '/auth/register' : '/auth/login';
      const {data} = await api.post(url, form);
      localStorage.setItem('campus_token', data.token);
      localStorage.setItem('campus_user', JSON.stringify(data.user));
      toast.success(mode === 'register' ? 'Account created' : 'Welcome back');
      const role = data.user.role;
      navigate(role === 'STUDENT' ? '/student' : role === 'MAINTENANCE' ? '/maintenance' : role === 'MANAGEMENT' ? '/management' : '/admin');
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to continue'); }
    finally { setLoading(false); }
  };
  if (mode === 'forgot') return <div className="auth-shell"><AuthBrand/><div className="auth-card"><h1>Reset password</h1><p>Request a reset token, then create a new password.</p><form onSubmit={async e=>{e.preventDefault();setLoading(true);try{const r=await api.post('/auth/forgot-password',{email:form.email});if(r.data.devResetToken){setForm({...form,resetToken:r.data.devResetToken});toast.info('Development reset token is filled below')}else toast.success('Reset instructions requested')}catch(e){toast.error(e.response?.data?.message||'Unable to request reset')}finally{setLoading(false)}}}><label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><button className="btn primary wide" disabled={loading}>Request reset token</button></form><form onSubmit={async e=>{e.preventDefault();setLoading(true);try{await api.post('/auth/reset-password',{token:form.resetToken,password:form.newPassword});toast.success('Password reset');setTimeout(()=>navigate('/login'),500)}catch(e){toast.error(e.response?.data?.message||'Unable to reset password')}finally{setLoading(false)}}}><label>Reset token<input required value={form.resetToken} onChange={e=>setForm({...form,resetToken:e.target.value})}/></label><label>New password<input type="password" required minLength="6" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})}/></label><button className="btn outline wide" disabled={loading}>Reset password</button></form><Link className="back-link" to="/login">Back to login</Link></div></div>;
  return <div className="auth-shell"><AuthBrand/><div className="auth-card"><h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1><p>{mode === 'register' ? 'Join your campus support network.' : 'Sign in to CampusCare.'}</p>
    {mode === 'login' && <div className="demo-accounts"><span>Demo accounts</span><button type="button" onClick={()=>setForm({...form,email:'student@campus.edu',password:'Campus@123'})}>Student</button><button type="button" onClick={()=>setForm({...form,email:'admin@campus.edu',password:'Campus@123'})}>Admin</button><button type="button" onClick={()=>setForm({...form,email:'maintenance@campus.edu',password:'Campus@123'})}>Maintenance</button><button type="button" onClick={()=>setForm({...form,email:'management@campus.edu',password:'Campus@123'})}>Management</button></div>}
    <form onSubmit={submit}>
      {mode === 'register' && <><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="form-grid"><label>Register number<input value={form.registerNumber} onChange={e=>setForm({...form,registerNumber:e.target.value})}/></label><label>Department<input value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></label></div><div className="form-grid"><label>Year<select value={form.year} onChange={e=>setForm({...form,year:e.target.value})}><option value="">Select</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div></>}
      <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Password<input type="password" required minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      {mode === 'login' && <div className="form-options"><label className="check"><input type="checkbox"/> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
      <button className="btn primary wide" disabled={loading}>{loading?'Please wait...':mode === 'register'?'Create account':'Sign in'}</button>
    </form>
    <p className="auth-switch">{mode === 'register'?'Already registered?':'New to CampusCare?'} <Link to={mode === 'register'?'/login':'/register'}>{mode === 'register'?'Sign in':'Create account'}</Link></p>
  </div></div>;
}
function AuthBrand(){return <div className="auth-brand"><div className="brand"><div className="brand-mark"><Building2 size={22}/></div>Campus<span>Care</span></div></div>}

function Protected({children,roles}) {
  const user = useAuth();
  if (!localStorage.getItem('campus_token') || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Layout({children,title,role='Student'}) {
  const user=useAuth(), navigate=useNavigate(), location=useLocation();
  const [open,setOpen]=useState(false);
  const links = role === 'Student' ? [
    ['Dashboard','/student',LayoutDashboard],['Submit complaint','/student/submit',Plus],['My complaints','/student/complaints',ClipboardList],['Notifications','/student/notifications',Bell],['Profile','/student/profile',UserRound]
  ] : role === 'Maintenance' ? [
    ['Dashboard','/maintenance',LayoutDashboard],['Assigned complaints','/maintenance/tasks',Wrench],['Work history','/maintenance/history',Clock3],['Profile','/maintenance/profile',UserRound]
  ] : role === 'Management' ? [
    ['Dashboard','/management',LayoutDashboard],['Analytics','/management/analytics',BarChart3],['Reports','/management/reports',FileText]
  ] : [
    ['Dashboard','/admin',LayoutDashboard],['All complaints','/admin/complaints',ClipboardList],['Students','/admin/students',Users],['Maintenance staff','/admin/staff',Wrench],['Departments','/admin/departments',Building2],['Analytics','/admin/analytics',BarChart3]
  ];
  return <div className="app-shell"><aside className={open?'sidebar open':'sidebar'}><div className="brand side-brand"><div className="brand-mark"><Building2 size={20}/></div>Campus<span>Care</span></div><button className="close-menu" onClick={()=>setOpen(false)}><X/></button><nav>{links.map(([name,path,Icon])=><Link key={path} to={path} className={location.pathname===path?'active':''}><Icon size={19}/>{name}</Link>)}</nav><button className="logout" onClick={()=>logout(navigate)}><LogOut size={18}/>Sign out</button></aside><section className="main-area"><header><button className="menu-button" onClick={()=>setOpen(true)}><Menu/></button><h2>{title}</h2><div className="header-actions"><button className="icon-button"><Bell size={19}/><i/></button><div className="avatar">{user?.name?.[0]||'U'}</div><div className="header-user"><b>{user?.name}</b><span>{role}</span></div></div></header><main className="content">{children}</main></section></div>;
}

function StatCards({items}) { return <div className="stat-grid">{items.map((x,i)=><div className={'stat-card '+(x.tone||'')} key={i}><div className="stat-icon">{x.icon}</div><div><span>{x.label}</span><b>{x.value}</b>{x.note&&<small>{x.note}</small>}</div></div>)}</div>}
function StatusBadge({status}) { return <span className={'status '+status?.toLowerCase().replaceAll(' ','-')}>{status}</span>}

function StudentDashboard() {
  const [d,setD]=useState(null);
  const user=useAuth();
  useEffect(()=>{api.get('/dashboard/student').then(r=>setD(r.data)).catch(()=>toast.error('Unable to load dashboard'))},[]);
  if(!d)return <Loading/>;
  return <><div className="page-heading"><div><span>STUDENT PORTAL</span><h1>Welcome back, {user?.name?.split(' ')[0]}</h1></div><Link className="btn primary" to="/student/submit"><Plus size={18}/>Submit complaint</Link></div>
    <StatCards items={[{label:'Total complaints',value:d.total,icon:<ClipboardList/>},{label:'Pending',value:d.pending,icon:<Clock3/>,tone:'blue'},{label:'In progress',value:d.inProgress,icon:<Wrench/>,tone:'amber'},{label:'Resolved',value:d.resolved,icon:<CheckCircle2/>,tone:'green'}]}/>
    <div className="dashboard-grid"><section className="panel"><div className="panel-title"><div><b>Recent complaints</b><span>Your latest submitted issues</span></div><Link to="/student/complaints">View all</Link></div><ComplaintTable items={d.recent||[]} student/></section><section className="panel status-panel"><div className="panel-title"><div><b>Status overview</b></div></div><StatusPie d={d}/></section></div></>;
}
function StatusPie({d}) { const data=[{name:'Pending',value:d.pending},{name:'In progress',value:d.inProgress},{name:'Resolved',value:d.resolved},{name:'Reopened',value:d.reopened}]; return <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{data.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>}

function ComplaintTable({items=[],student=false}) {
  const navigate=useNavigate();
  return <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Complaint</th><th>Category</th><th>Date</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{items.length?items.map(c=><tr key={c._id}><td><b>{c.ticketId}</b></td><td>{c.title}</td><td>{c.category}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td><td><span className={'priority '+c.priority?.toLowerCase()}>{c.priority}</span></td><td><StatusBadge status={c.status}/></td><td><button className="text-button" onClick={()=>navigate(student?'/student/complaints/'+c._id:'/admin/complaints/'+c._id)}>View</button></td></tr>):<tr><td colSpan="7"><Empty>No complaints found</Empty></td></tr>}</tbody></table></div>
}
function Loading(){return <div className="loading"><div className="spinner"/></div>}
function Empty({children}){return <div className="empty-state"><ClipboardList/><b>{children}</b></div>}

function SubmitComplaint(){
  const [form,setForm]=useState({title:'',description:'',category:'',priority:'Medium',location:'',building:'',floor:'',roomNumber:''});
  const [files,setFiles]=useState([]),[loading,setLoading]=useState(false),navigate=useNavigate();
  const submit=async e=>{
    e.preventDefault();setLoading(true);
    try{
      const data=new FormData();Object.entries(form).forEach(([k,v])=>data.append(k,v));files.forEach(f=>data.append('images',f));
      let r;try{r=await api.post('/complaints',data)}catch(err){if(err.response?.status===409){if(window.confirm(err.response.data.message+'. Submit anyway?')){data.append('confirmDuplicate','true');r=await api.post('/complaints',data)}else return}}
      toast.success('Complaint submitted');navigate('/student/complaints/'+r.data._id);
    }catch(err){toast.error(err.response?.data?.message||'Submission failed')}finally{setLoading(false)}
  };
  return <><div className="page-heading"><div><span>NEW REQUEST</span><h1>Submit a complaint</h1></div></div><form className="form-panel" onSubmit={submit}><div className="form-section"><h3>Complaint details</h3><label>Complaint title<input required placeholder="Brief summary of the issue" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Description<textarea required rows="5" placeholder="Describe the issue, when it started and what help is needed" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="form-grid"><label>Category<select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label></div></div><div className="form-section"><h3>Location</h3><div className="form-grid"><label>Campus location<input required placeholder="e.g. Engineering Hostel" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Building / block<input placeholder="e.g. Block B" value={form.building} onChange={e=>setForm({...form,building:e.target.value})}/></label></div><div className="form-grid"><label>Floor<input placeholder="e.g. 2" value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})}/></label><label>Room number<input placeholder="e.g. B-204" value={form.roomNumber} onChange={e=>setForm({...form,roomNumber:e.target.value})}/></label></div></div><div className="form-section"><h3>Evidence</h3><label className="upload-box"><input type="file" multiple accept="image/*" onChange={e=>setFiles([...e.target.files])}/><Plus/><b>Add photos</b><span>PNG or JPG, up to 5 MB</span></label>{files.length>0&&<div className="file-list">{files.map(f=><span key={f.name}>{f.name}</span>)}</div>}</div><div className="form-actions"><button type="button" className="btn ghost" onClick={()=>navigate(-1)}>Cancel</button><button className="btn primary" disabled={loading}>{loading?'Submitting...':'Submit complaint'}</button></div></form></>;
}

function MyComplaints(){
  const [items,setItems]=useState([]),[status,setStatus]=useState(''),[category,setCategory]=useState(''),[search,setSearch]=useState('');
  useEffect(()=>{api.get('/complaints/my').then(r=>setItems(r.data)).catch(()=>toast.error('Unable to load complaints'))},[]);
  const filtered=items.filter(c=>(!status||c.status===status)&&(!category||c.category===category)&&(!search||`${c.title} ${c.ticketId}`.toLowerCase().includes(search.toLowerCase())));
  return <><div className="page-heading"><div><span>COMPLAINTS</span><h1>My complaints</h1></div><Link className="btn primary" to="/student/submit"><Plus size={18}/>New complaint</Link></div><section className="panel"><div className="filters"><label><Search/><input placeholder="Search complaints" value={search} onChange={e=>setSearch(e.target.value)}/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['Submitted','Under Review','Assigned','In Progress','Resolved','Closed','Reopened','Rejected'].map(s=><option key={s}>{s}</option>)}</select><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div><ComplaintTable items={filtered} student/></section></>;
}

function ComplaintDetails(){
  const {id}=useParams(),[c,setC]=useState(null),[history,setHistory]=useState([]);
  useEffect(()=>{Promise.all([api.get('/complaints/'+id),api.get('/complaints/'+id+'/history')]).then(([a,b])=>{setC(a.data);setHistory(b.data)}).catch(e=>toast.error(e.response?.data?.message||'Unable to load complaint'))},[id]);
  const reopen=async()=>{const comment=window.prompt('What is still unresolved?');if(comment===null)return;try{await api.post('/complaints/'+id+'/reopen',{comment});toast.success('Complaint reopened');window.location.reload()}catch(e){toast.error(e.response?.data?.message||'Unable to reopen')}};
  const confirmResolved=async()=>{try{await api.post('/complaints/'+id+'/close');toast.success('Resolution confirmed');window.location.reload()}catch(e){toast.error(e.response?.data?.message||'Unable to confirm resolution')}};
  const submitFeedback=async()=>{const ratingInput=window.prompt('Rating (1-5)');if(ratingInput===null)return;const rating=Number(ratingInput);if(!rating)return;const feedback=window.prompt('Share optional feedback')||'';try{await api.post('/complaints/'+id+'/feedback',{rating,feedback});toast.success('Feedback submitted')}catch(e){toast.error(e.response?.data?.message||'Unable to submit feedback')}};
  if(!c)return <Loading/>;const timeline=['Submitted','Under Review','Assigned','In Progress','Resolved','Closed'];const idx=timeline.indexOf(c.status);
  return <><div className="page-heading"><div><span>{c.ticketId}</span><h1>{c.title}</h1></div><StatusBadge status={c.status}/></div><div className="detail-grid"><section className="panel"><div className="panel-title"><b>Complaint details</b></div><p className="description">{c.description}</p><div className="detail-fields"><div><span>Category</span><b>{c.category}</b></div><div><span>Priority</span><b>{c.priority}</b></div><div><span>Location</span><b>{c.location}</b></div><div><span>Building / Room</span><b>{c.building||'-'} / {c.roomNumber||'-'}</b></div><div><span>Submitted</span><b>{new Date(c.createdAt).toLocaleString()}</b></div><div><span>Assigned staff</span><b>{c.assignedTo?.name||'Not assigned'}</b></div></div><div className="progress-timeline">{timeline.map((s,i)=><div className={i<=idx?'done':i===idx+1?'next':''} key={s}><div>{i<=idx?<CheckCircle2/>:<span>{i+1}</span>}</div><b>{s}</b></div>)}</div></section><section className="panel"><div className="panel-title"><b>Complaint history</b></div><div className="history-list">{history.map((h,i)=><div key={h._id||i}><div className="history-dot"/><div><b>{h.newStatus}</b><span>{h.comment||'Status updated'}</span><small>{new Date(h.createdAt||h.timestamp).toLocaleString()}</small></div></div>)}</div>{c.status==='Resolved'&&<><button className="btn primary wide" onClick={confirmResolved}><CheckCircle2 size={17}/>Confirm resolution</button><button className="btn outline wide" onClick={reopen}><AlertTriangle size={17}/>Issue not resolved — reopen</button></>}{['Resolved','Closed'].includes(c.status)&&<button className="btn ghost wide" onClick={submitFeedback}>Give rating and feedback</button>}</section></div></>;
}

function AdminDashboard() {
  const [d,setD]=useState(null);
  useEffect(()=>{api.get('/dashboard/admin').then(r=>setD(r.data)).catch(()=>toast.error('Unable to load dashboard'))},[]);
  if(!d)return <Loading />;
  const chartData=Object.entries(d.categories||{}).map(([name,value])=>({name:name.replace(' and ',' & ').replace('problems',''),value}));
  return <><div className="page-heading"><div><span>ADMINISTRATION</span><h1>Command center</h1></div><Link className="btn primary" to="/admin/complaints"><Search size={18}/>Review complaints</Link></div>
    <StatCards items={[
      {label:'Total complaints',value:d.total,icon:<ClipboardList/>},{label:'New complaints',value:d.newComplaints,icon:<FileText/>,tone:'blue'},
      {label:'In progress',value:d.inProgress,icon:<Wrench/>,tone:'amber'},{label:'Resolved',value:d.resolved,icon:<CheckCircle2/>,tone:'green'},
      {label:'Overdue',value:d.overdue,icon:<AlertTriangle/>,tone:'red'},{label:'Resolution rate',value:d.resolutionPercent+'%',icon:<TrendingUp/>,tone:'violet'}
    ]}/>
    <div className="dashboard-grid"><section className="panel"><div className="panel-title"><div><b>Complaints by category</b><span>Most reported campus issues</span></div></div><ResponsiveContainer width="100%" height={260}><BarChart data={chartData.slice(0,8)}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></section><section className="panel"><div className="panel-title"><div><b>Critical alerts</b><span>Requires immediate attention</span></div></div><div className="alert-list">{(d.recent||[]).filter(c=>c.priority==='Critical').slice(0,4).map(c=><div key={c._id}><div className="alert-icon"><AlertTriangle/></div><div><b>{c.title}</b><span>{c.location} • {c.ticketId}</span></div><button className="text-button" onClick={()=>window.location.href='/admin/complaints/'+c._id}>Review</button></div>)}{!(d.recent||[]).some(c=>c.priority==='Critical')&&<Empty>No critical alerts</Empty>}</div></section></div>
    <section className="panel table-panel"><div className="panel-title"><div><b>Recent complaints</b><span>Search and manage all requests</span></div><Link to="/admin/complaints">View all</Link></div><ComplaintTable items={d.recent||[]}/></section>
  </>;
}

function AdminComplaints() {
  const [data,setData]=useState({items:[]}),[search,setSearch]=useState(''),[status,setStatus]=useState('');
  const load=()=>api.get('/complaints',{params:{search,status,limit:100}}).then(r=>setData(r.data)).catch(()=>toast.error('Unable to load complaints'));
  useEffect(()=>{load()},[status]);
  const approve=async c=>{const staff=await api.get('/users',{params:{role:'MAINTENANCE'}});const staffId=window.prompt('Enter staff ID:\n'+staff.data.map(s=>`${s.name} — ${s._id}`).join('\n'));if(!staffId)return;try{await api.post(`/complaints/${c._id}/assign`,{staffId});toast.success('Complaint assigned');load()}catch(e){toast.error(e.response?.data?.message||'Unable to assign')}};
  return <><div className="page-heading"><div><span>COMPLAINT MANAGEMENT</span><h1>All complaints</h1></div></div><section className="panel"><div className="filters"><label><Search/><input placeholder="Search ticket or title" value={search} onChange={e=>setSearch(e.target.value)} onKeyUp={()=>{}}/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{['Submitted','Under Review','Assigned','In Progress','Resolved','Closed','Rejected','Reopened'].map(s=><option key={s}>{s}</option>)}</select><button className="btn ghost" onClick={load}>Search</button></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Complaint</th><th>Student</th><th>Priority</th><th>Status</th><th>Staff</th><th>Action</th></tr></thead><tbody>{data.items.length?data.items.map(c=><tr key={c._id}><td><b>{c.ticketId}</b></td><td>{c.title}</td><td>{c.studentId?.name||'-'}</td><td><span className={'priority '+c.priority?.toLowerCase()}>{c.priority}</span></td><td><StatusBadge status={c.status}/></td><td>{c.assignedTo?.name||'-'}</td><td>{['Submitted','Under Review'].includes(c.status)?<button className="text-button" onClick={()=>approve(c)}>Assign</button>:<Link className="text-button" to={'/admin/complaints/'+c._id}>View</Link>}</td></tr>):<tr><td colSpan="7"><Empty>No complaints found</Empty></td></tr>}</tbody></table></div></section></>;
}

function AdminDetail() {
  const {id}=useParams(),[c,setC]=useState(null),[staff,setStaff]=useState([]);
  const load=()=>{Promise.all([api.get('/complaints/'+id),api.get('/users',{params:{role:'MAINTENANCE'}})]).then(([a,b])=>{setC(a.data);setStaff(b.data)}).catch(e=>toast.error(e.response?.data?.message||'Unable to load'))};
  useEffect(()=>{load()},[id]);
  const action=async(status,reason)=>{try{await api.patch('/complaints/'+id+'/status',{status,reason,comment:reason||''});toast.success('Status updated');load()}catch(e){toast.error(e.response?.data?.message||'Unable to update')}};
  if(!c)return <Loading />;
  return <><div className="page-heading"><div><span>{c.ticketId}</span><h1>{c.title}</h1></div><StatusBadge status={c.status}/></div><div className="detail-grid"><section className="panel"><div className="panel-title"><b>Review complaint</b></div><p className="description">{c.description}</p><div className="detail-fields"><div><span>Student</span><b>{c.studentId?.name}</b></div><div><span>Department</span><b>{c.studentId?.department||'-'}</b></div><div><span>Category</span><b>{c.category}</b></div><div><span>Location</span><b>{c.location}</b></div></div><div className="form-actions">{['Submitted','Under Review'].includes(c.status)&&<><button className="btn outline" onClick={()=>{const reason=window.prompt('Reason for rejection');if(reason)action('Rejected',reason)}}>Reject</button><button className="btn primary" onClick={()=>{const id=window.prompt('Enter maintenance staff ID:\\n'+staff.map(s=>`${s.name} — ${s._id}`).join('\\n'));if(id)api.post(`/complaints/${c._id}/assign`,{staffId:id}).then(()=>{toast.success('Assigned');load()}).catch(e=>toast.error(e.response?.data?.message||'Unable to assign'))}}>Approve & assign</button></>}{c.status==='In Progress'&&<button className="btn primary" onClick={()=>action('Resolved')}>Mark resolved</button>}</div></section><section className="panel"><div className="panel-title"><b>Available maintenance staff</b></div><div className="staff-list">{staff.map(s=><div key={s._id}><div className="avatar">{s.name[0]}</div><div><b>{s.name}</b><span>{s.employeeId||'Maintenance staff'}</span></div></div>)}</div></section></div></>;
}

function UserManagement({role='STUDENT'}) {
  const [users,setUsers]=useState([]),[show,setShow]=useState(false),[form,setForm]=useState({name:'',email:'',password:'Campus@123',role:role==='MAINTENANCE'?'MAINTENANCE':'STUDENT',department:'',employeeId:''});
  const load=()=>api.get('/users',{params:role==='STUDENT'?{}:{role}}).then(r=>setUsers(role==='STUDENT'?r.data.filter(u=>u.role==='STUDENT'):r.data)).catch(()=>toast.error('Unable to load users'));
  useEffect(()=>{load()},[role]);
  const create=async e=>{e.preventDefault();try{await api.post('/users',form);toast.success('Account created');setShow(false);load()}catch(e){toast.error(e.response?.data?.message||'Unable to create account')}};
  return <><div className="page-heading"><div><span>USER MANAGEMENT</span><h1>{role==='MAINTENANCE'?'Maintenance staff':'Students'}</h1></div>{role==='MAINTENANCE'&&<button className="btn primary" onClick={()=>setShow(true)}><Plus size={18}/>Add staff</button>}</div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>{role==='MAINTENANCE'?'Employee ID':'Register number'}</th><th>Department</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u._id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.employeeId||u.registerNumber||'-'}</td><td>{u.department||'-'}</td><td><button className="text-button" onClick={async()=>{if(window.confirm('Delete this account?')){await api.delete('/users/'+u._id);load()}}}>Delete</button></td></tr>)}</tbody></table></div></section>{show&&<div className="modal-backdrop" onMouseDown={()=>setShow(false)}><form className="modal" onMouseDown={e=>e.stopPropagation()} onSubmit={create}><div className="panel-title"><b>Add maintenance account</b><button type="button" onClick={()=>setShow(false)}><X/></button></div><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><div className="form-grid"><label>Employee ID<input value={form.employeeId} onChange={e=>setForm({...form,employeeId:e.target.value})}/></label><label>Department<input value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></label></div><label>Initial password<input required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="btn primary wide">Create account</button></form></div>}</>;
}

function DepartmentManagement(){
  const [items,setItems]=useState([]),[form,setForm]=useState({departmentName:'',departmentCode:'',description:''});
  const load=()=>api.get('/departments').then(r=>setItems(r.data)).catch(()=>toast.error('Unable to load departments'));
  useEffect(()=>{load()},[]);
  const add=async e=>{e.preventDefault();try{await api.post('/departments',form);toast.success('Department added');setForm({departmentName:'',departmentCode:'',description:''});load()}catch(err){toast.error(err.response?.data?.message||'Unable to add department')}};
  return <><div className="page-heading"><div><span>CONFIGURATION</span><h1>Departments</h1></div></div><div className="two-column"><section className="panel"><div className="panel-title"><b>Department list</b></div><div className="staff-list">{items.map(d=><div key={d._id}><div className="avatar"><Building2/></div><div><b>{d.departmentName}</b><span>{d.departmentCode} • {d.description}</span></div><button className="text-button" onClick={async()=>{if(window.confirm('Delete department?')){await api.delete('/departments/'+d._id);load()}}}>Delete</button></div>)}</div></section><form className="form-panel" onSubmit={add}><h3>Add department</h3><label>Name<input required value={form.departmentName} onChange={e=>setForm({...form,departmentName:e.target.value})}/></label><label>Code<input required value={form.departmentCode} onChange={e=>setForm({...form,departmentCode:e.target.value.toUpperCase()})}/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="btn primary wide">Add department</button></form></div></>;
}

function MaintenanceDashboard() {
  const [d,setD]=useState(null);
  useEffect(()=>{api.get('/dashboard/maintenance').then(r=>setD(r.data)).catch(()=>toast.error('Unable to load dashboard'))},[]);
  if(!d)return <Loading />;
  return <><div className="page-heading"><div><span>MAINTENANCE PORTAL</span><h1>My work overview</h1></div></div><StatCards items={[{label:'Assigned tasks',value:d.total,icon:<ClipboardList/>},{label:'Pending',value:d.pending,icon:<Clock3/>,tone:'blue'},{label:'In progress',value:d.inProgress,icon:<Wrench/>,tone:'amber'},{label:'Completed',value:d.completed,icon:<CheckCircle2/>,tone:'green'}]}/><section className="panel table-panel"><div className="panel-title"><div><b>Recently assigned</b><span>Tasks requiring action</span></div></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Complaint</th><th>Location</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{d.recent.length?d.recent.map(c=><tr key={c._id}><td><b>{c.ticketId}</b></td><td>{c.title}</td><td>{c.location}</td><td><span className={'priority '+c.priority?.toLowerCase()}>{c.priority}</span></td><td><StatusBadge status={c.status}/></td><td><Link className="text-button" to={'/maintenance/tasks/'+c._id}>Open</Link></td></tr>):<tr><td colSpan="6"><Empty>No assigned tasks</Empty></td></tr>}</tbody></table></div></section></>;
}
function MaintenanceTasks(){
  const [items,setItems]=useState([]),[status,setStatus]=useState('');
  const load=()=>api.get('/maintenance/tasks').then(r=>setItems(r.data)).catch(()=>toast.error('Unable to load tasks'));
  useEffect(()=>{load()},[]);
  const filtered=items.filter(c=>!status||c.status===status);
  return <><div className="page-heading"><div><span>WORK QUEUE</span><h1>Assigned complaints</h1></div></div><section className="panel"><div className="filters"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Assigned</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Complaint</th><th>Location</th><th>Priority</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(c=><tr key={c._id}><td><b>{c.ticketId}</b></td><td>{c.title}</td><td>{c.location}</td><td><span className={'priority '+c.priority?.toLowerCase()}>{c.priority}</span></td><td><StatusBadge status={c.status}/></td><td><Link className="text-button" to={'/maintenance/tasks/'+c._id}>Manage</Link></td></tr>)}</tbody></table></div></section></>;
}
function MaintenanceDetail(){
  const {id}=useParams(),[c,setC]=useState(null),[note,setNote]=useState(''),[files,setFiles]=useState([]);
  const load=()=>api.get('/complaints/'+id).then(r=>setC(r.data)).catch(e=>toast.error(e.response?.data?.message||'Unable to load task'));
  useEffect(()=>{load()},[id]);
  const progress=async()=>{try{await api.patch('/maintenance/tasks/'+id+'/progress',{note});toast.success('Progress updated');load()}catch(e){toast.error(e.response?.data?.message||'Unable to update')}};
  const resolve=async e=>{e.preventDefault();const data=new FormData();data.append('resolutionNotes',note);files.forEach(f=>data.append('resolutionImages',f));try{await api.post('/maintenance/tasks/'+id+'/resolve',data);toast.success('Resolution submitted');load()}catch(e){toast.error(e.response?.data?.message||'Unable to resolve')}};
  if(!c)return <Loading />;
  return <><div className="page-heading"><div><span>{c.ticketId}</span><h1>{c.title}</h1></div><StatusBadge status={c.status}/></div><div className="detail-grid"><section className="panel"><div className="panel-title"><b>Task details</b></div><p className="description">{c.description}</p><div className="detail-fields"><div><span>Location</span><b>{c.location}</b></div><div><span>Building / Room</span><b>{c.building||'-'} / {c.roomNumber||'-'}</b></div><div><span>Priority</span><b>{c.priority}</b></div><div><span>Expected resolution</span><b>{c.expectedResolutionDate?new Date(c.expectedResolutionDate).toLocaleString():'-'}</b></div></div></section><form className="form-panel" onSubmit={resolve}><h3>Update work</h3><label>Progress notes<textarea required rows="4" value={note} onChange={e=>setNote(e.target.value)} placeholder="Document work performed"/></label><label className="upload-box"><input type="file" multiple accept="image/*" onChange={e=>setFiles([...e.target.files])}/><Plus/><b>Resolution evidence</b><span>Optional photos</span></label>{c.status!=='Resolved'&&c.status!=='Closed'&&<><button type="button" className="btn outline wide" onClick={progress}>Save progress</button><button className="btn primary wide">Submit resolution</button></>}</form></div></>;
}

function ManagementDashboard(){
  const [d,setD]=useState(null);
  useEffect(()=>{api.get('/dashboard/management').then(r=>setD(r.data)).catch(()=>toast.error('Unable to load analytics'))},[]);
  if(!d)return <Loading />;
  const chart=Object.entries(d.categories||{}).map(([name,value])=>({name,value}));
  const download=()=>{const rows=[['Metric','Value'],['Complaint volume',d.volume],['Resolution rate',d.resolutionRate+'%'],['Average resolution hours',d.averageResolutionHours],['SLA compliance',d.slaCompliance+'%']];const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='campus-complaint-report.csv';a.click()};
  return <><div className="page-heading"><div><span>MANAGEMENT PORTAL</span><h1>Campus performance</h1></div><button className="btn primary" onClick={download}><FileText size={18}/>Download report</button></div><StatCards items={[{label:'Complaint volume',value:d.volume,icon:<ClipboardList/>},{label:'Resolution rate',value:d.resolutionRate+'%',icon:<CheckCircle2/>,tone:'green'},{label:'Avg resolution',value:d.averageResolutionHours+'h',icon:<Clock3/>,tone:'amber'},{label:'SLA compliance',value:d.slaCompliance+'%',icon:<TrendingUp/>,tone:'violet'}]}/><div className="dashboard-grid"><section className="panel"><div className="panel-title"><b>Recurring complaint categories</b></div><ResponsiveContainer width="100%" height={300}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></section><section className="panel"><div className="panel-title"><b>SLA performance</b></div><div className="gauge"><div style={{'--value':d.slaCompliance+'%'}}><b>{d.slaCompliance}%</b><span>On time</span></div></div></section></div></>;
}

function MaintenanceHistory(){
  const [items,setItems]=useState([]);
  useEffect(()=>{api.get('/maintenance/tasks').then(r=>setItems(r.data.filter(c=>['Resolved','Closed'].includes(c.status)))).catch(()=>toast.error('Unable to load work history'))},[]);
  return <><div className="page-heading"><div><span>COMPLETED WORK</span><h1>Work history</h1></div></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Complaint</th><th>Location</th><th>Resolved</th><th>Status</th></tr></thead><tbody>{items.length?items.map(c=><tr key={c._id}><td><b>{c.ticketId}</b></td><td>{c.title}</td><td>{c.location}</td><td>{c.resolvedAt?new Date(c.resolvedAt).toLocaleDateString():'-'}</td><td><StatusBadge status={c.status}/></td></tr>):<tr><td colSpan="5"><Empty>No completed work</Empty></td></tr>}</tbody></table></div></section></>;
}

function NotificationsPage(){
  const [items,setItems]=useState([]);
  const load=()=>api.get('/notifications').then(r=>setItems(r.data)).catch(()=>toast.error('Unable to load notifications'));
  useEffect(()=>{load()},[]);
  const readAll=()=>api.patch('/notifications/read-all').then(()=>load());
  return <><div className="page-heading"><div><span>UPDATES</span><h1>Notifications</h1></div><button className="btn ghost" onClick={readAll}>Mark all read</button></div><section className="panel notification-list">{items.length?items.map(n=><button key={n._id} className={n.isRead?'':'unread'} onClick={()=>api.patch('/notifications/'+n._id+'/read').then(load)}><div className="alert-icon"><Bell/></div><div><b>{n.title}</b><span>{n.message}</span><small>{new Date(n.createdAt).toLocaleString()}</small></div></button>):<Empty>No notifications</Empty>}</section></>;
}
function ProfilePage(){
  const u=useAuth();
  return <><div className="page-heading"><div><span>ACCOUNT</span><h1>My profile</h1></div></div><section className="profile-card"><div className="profile-avatar">{u?.name?.[0]||'U'}</div><div><h2>{u?.name}</h2><p>{u?.email}</p><StatusBadge status={u?.role}/></div></section><section className="panel"><div className="panel-title"><b>Personal information</b></div><div className="detail-fields"><div><span>Full name</span><b>{u?.name}</b></div><div><span>Email</span><b>{u?.email}</b></div><div><span>Role</span><b>{u?.role}</b></div><div><span>Department</span><b>{u?.department||'Not specified'}</b></div></div></section></>;
}
function Placeholder({title}){return <><div className="page-heading"><div><span>REPORTING</span><h1>{title}</h1></div></div><section className="panel"><Empty>{title} is ready for report data</Empty></section></>}

function App() {
  return <Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/>
    <Route path="/student" element={<Protected roles={['STUDENT']}><Layout title="Dashboard"><StudentDashboard/></Layout></Protected>}/>
    <Route path="/student/submit" element={<Protected roles={['STUDENT']}><Layout title="Submit complaint"><SubmitComplaint/></Layout></Protected>}/>
    <Route path="/student/complaints" element={<Protected roles={['STUDENT']}><Layout title="My complaints"><MyComplaints/></Layout></Protected>}/>
    <Route path="/student/complaints/:id" element={<Protected roles={['STUDENT']}><Layout title="Complaint details"><ComplaintDetails/></Layout></Protected>}/>
    <Route path="/student/notifications" element={<Protected roles={['STUDENT']}><Layout title="Notifications"><NotificationsPage/></Layout></Protected>}/>
    <Route path="/student/profile" element={<Protected roles={['STUDENT']}><Layout title="Profile"><ProfilePage/></Layout></Protected>}/>
    <Route path="/admin" element={<Protected roles={['ADMIN']}><Layout title="Admin dashboard" role="Admin"><AdminDashboard/></Layout></Protected>}/>
    <Route path="/admin/complaints" element={<Protected roles={['ADMIN']}><Layout title="All complaints" role="Admin"><AdminComplaints/></Layout></Protected>}/>
    <Route path="/admin/complaints/:id" element={<Protected roles={['ADMIN']}><Layout title="Complaint review" role="Admin"><AdminDetail/></Layout></Protected>}/>
    <Route path="/admin/students" element={<Protected roles={['ADMIN']}><Layout title="Manage students" role="Admin"><UserManagement role="STUDENT"/></Layout></Protected>}/>
    <Route path="/admin/staff" element={<Protected roles={['ADMIN']}><Layout title="Maintenance staff" role="Admin"><UserManagement role="MAINTENANCE"/></Layout></Protected>}/>
    <Route path="/admin/departments" element={<Protected roles={['ADMIN']}><Layout title="Departments" role="Admin"><DepartmentManagement/></Layout></Protected>}/>
    <Route path="/admin/analytics" element={<Protected roles={['ADMIN']}><Layout title="Analytics" role="Admin"><ManagementDashboard/></Layout></Protected>}/>
    <Route path="/maintenance" element={<Protected roles={['MAINTENANCE']}><Layout title="Maintenance dashboard" role="Maintenance"><MaintenanceDashboard/></Layout></Protected>}/>
    <Route path="/maintenance/tasks" element={<Protected roles={['MAINTENANCE']}><Layout title="Assigned complaints" role="Maintenance"><MaintenanceTasks/></Layout></Protected>}/>
    <Route path="/maintenance/tasks/:id" element={<Protected roles={['MAINTENANCE']}><Layout title="Task details" role="Maintenance"><MaintenanceDetail/></Layout></Protected>}/>
    <Route path="/maintenance/history" element={<Protected roles={['MAINTENANCE']}><Layout title="Work history" role="Maintenance"><MaintenanceHistory/></Layout></Protected>}/>
    <Route path="/maintenance/profile" element={<Protected roles={['MAINTENANCE']}><Layout title="Profile" role="Maintenance"><ProfilePage/></Layout></Protected>}/>
    <Route path="/management" element={<Protected roles={['MANAGEMENT']}><Layout title="Management dashboard" role="Management"><ManagementDashboard/></Layout></Protected>}/>
    <Route path="/management/analytics" element={<Protected roles={['MANAGEMENT']}><Layout title="Overall analytics" role="Management"><ManagementDashboard/></Layout></Protected>}/>
    <Route path="/management/reports" element={<Protected roles={['MANAGEMENT']}><Layout title="Reports" role="Management"><Placeholder title="Reports and exports"/></Layout></Protected>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}

export default App;
