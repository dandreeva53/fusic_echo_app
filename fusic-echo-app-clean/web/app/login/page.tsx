'use client';
import { useState } from 'react';
import { register, signin } from '@/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Sign in with your NHS email</h2>
        <input className="input mb-2" placeholder="name@nhs.net" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input mb-2" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={()=>signin(email,pass)} className="btn">Sign in</button>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Create account</h2>
        <input className="input mb-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input mb-2" placeholder="name@nhs.net" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input mb-2" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        <button onClick={()=>register(email,pass,name)} className="btn">Register</button>
      </div>
    </div>
  );
}
