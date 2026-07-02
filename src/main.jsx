import React, {useEffect, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CreditCard, Settings, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import './styles.css';

const API = '/api';

function money(n){ return Number(n||0).toLocaleString('vi-VN') + 'đ'; }

function App(){
  const [tab,setTab]=useState('register');
  const [tournament,setTournament]=useState(null);
  const [form,setForm]=useState({full_name:'', phone:'', gender:'male', marked_paid:true});
  const [msg,setMsg]=useState('');
  const [admin,setAdmin]=useState({items:[], loading:false});

  async function loadTournament(){
    try { const r=await fetch(API+'/tournament'); const d=await r.json(); setTournament(d.tournament); }
    catch(e){ setMsg('Chưa kết nối được API. Kiểm tra Cloudflare Pages Functions.'); }
  }
  async function loadAdmin(){
    setAdmin(a=>({...a, loading:true}));
    try { const r=await fetch(API+'/registrations'); const d=await r.json(); setAdmin({items:d.registrations||[], loading:false}); }
    catch(e){ setAdmin({items:[], loading:false}); setMsg('Không tải được danh sách đăng ký.'); }
  }
  useEffect(()=>{ loadTournament(); },[]);
  useEffect(()=>{ if(tab==='admin') loadAdmin(); },[tab]);

  async function submit(e){
    e.preventDefault(); setMsg('Đang gửi đăng ký...');
    try{
      const r=await fetch(API+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Lỗi đăng ký');
      setMsg('Đăng ký thành công. Trạng thái: chờ BTC xác nhận thanh toán.');
      setForm({full_name:'', phone:'', gender:'male', marked_paid:true});
    }catch(err){ setMsg(err.message); }
  }
  async function confirmPayment(id, status){
    await fetch(API+'/confirm-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registration_id:id,status})});
    loadAdmin();
  }
  return <div className="app">
    <header className="hero">
      <div className="brand">PickleCity League</div>
      <h1>PickleCity Weekly Open</h1>
      <p>Đăng ký giải đấu • Thanh toán • BTC xác nhận</p>
    </header>
    <nav className="tabs">
      <button className={tab==='register'?'active':''} onClick={()=>setTab('register')}>VĐV đăng ký</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>Dashboard BTC</button>
      <button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}>Cài đặt giải</button>
    </nav>
    {msg && <div className="notice">{msg}</div>}
    {tab==='register' && <main className="grid">
      <section className="card">
        <div className="card-title"><Trophy/> Giải đang mở</div>
        {tournament ? <>
          <h2>{tournament.name}</h2>
          <p><b>Lệ phí:</b> {money(tournament.fee)}</p>
          <p><b>Quy mô:</b> {tournament.max_players} VĐV</p>
          <p><b>Thời gian:</b> {tournament.start_time}</p>
          <p><b>Hạn đăng ký:</b> {tournament.register_deadline}</p>
          <hr/>
          <p>🥇 Giải nhất: <b>{money(tournament.first_prize)}</b></p>
          <p>🥈 Giải nhì: <b>{money(tournament.second_prize)}</b></p>
          <p>🥉 Đồng giải ba: <b>{money(tournament.third_prize)}/đội</b></p>
          <p className="muted">{tournament.sponsor_note}</p>
        </> : <p>Đang tải thông tin giải...</p>}
      </section>
      <section className="card">
        <div className="card-title"><CreditCard/> Thanh toán</div>
        <div className="qrbox"><img src="/qr-vcb.jpg" onError={(e)=>e.currentTarget.style.display='none'} /></div>
        <p><b>STK:</b> 2022026869</p><p><b>Chủ TK:</b> TRẦN THỊ HOÀI THANH</p><p><b>Ngân hàng:</b> Vietcombank</p><p><b>Nội dung:</b> Họ tên + SĐT</p>
      </section>
      <section className="card formcard">
        <div className="card-title"><Users/> Form đăng ký</div>
        <form onSubmit={submit}>
          <label>Họ và tên<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
          <label>Số điện thoại<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Giới tính<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
          <label className="check"><input type="checkbox" checked={form.marked_paid} onChange={e=>setForm({...form,marked_paid:e.target.checked})}/> Tôi đã chuyển khoản lệ phí</label>
          <button className="primary">Đăng ký tham gia</button>
        </form>
      </section>
    </main>}
    {tab==='admin' && <main className="card wide">
      <div className="card-title"><Settings/> Dashboard BTC <button className="mini" onClick={loadAdmin}><RefreshCw size={14}/> Tải lại</button></div>
      {admin.loading ? <p>Đang tải...</p> : <table><thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Hạng</th><th>Thanh toán</th><th>Thao tác</th></tr></thead><tbody>{admin.items.map((x,i)=><tr key={x.registration_id}><td>{i+1}</td><td>{x.full_name}</td><td>{x.phone}</td><td>{x.gender==='male'?'Nam':'Nữ'}</td><td>{x.level_group}</td><td><Status s={x.payment_status}/></td><td><button onClick={()=>confirmPayment(x.registration_id,'BTC_CONFIRMED')}>Xác nhận</button><button onClick={()=>confirmPayment(x.registration_id,'PENDING')}>Pending</button></td></tr>)}</tbody></table>}
    </main>}
    {tab==='settings' && <main className="card wide"><div className="card-title"><Settings/> Cài đặt giải</div><p>V1.0 Alpha: cài đặt phí và giải thưởng đang lưu trong database D1. Bản tiếp theo sẽ có form chỉnh trực tiếp tại đây.</p></main>}
  </div>
}
function Status({s}){ if(s==='BTC_CONFIRMED') return <span className="ok"><CheckCircle size={16}/> Đã xác nhận</span>; if(s==='PLAYER_MARKED_PAID') return <span className="warn"><Clock size={16}/> VĐV báo đã CK</span>; return <span className="pending"><Clock size={16}/> Pending</span> }
createRoot(document.getElementById('root')).render(<App/>);
