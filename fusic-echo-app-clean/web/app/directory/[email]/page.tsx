'use client';
import { useParams } from 'next/navigation';

// For now, re-use the same mock. Later this will query Firestore.
const MOCK = {
  'bob@uclh.nhs.uk': { name: 'Bob Peters', email:'bob@uclh.nhs.uk', role:'Fellow', accreditations:['FUSIC','BSE Level 1'], about:'' },
  'd.2204.a@gmail.com': { name: 'Melanie Biggs', email:'d.2204.a@gmail.com', role:'Supervisor', accreditations:[], about:'' },
  'carol@uclh.nhs.uk': { name: 'Carol Smith', email:'carol@uclh.nhs.uk', role:'Fellow', accreditations:['FUSIC'], about:'' },
  'd.andreeva171@gmail.com': { name: 'Daria', email:'d.andreeva171@gmail.com', role:'Fellow', accreditations:[], about:'' },
};

export default function Profile() {
  const params = useParams();
  const email = decodeURIComponent(params.email as string);
  const user = MOCK[email];

  if (!user) return <p className="p-4">User not found</p>;

  return (
    <div>
      <div className="bg-blue-500 h-24" />
      <div className="-mt-12 flex justify-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white" />
      </div>
      <div className="p-6 text-center space-y-4">
        <div>
          <div className="text-xl font-semibold">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>

        <div className="text-left space-y-2">
          <div>
            <div className="font-semibold">Role</div>
            <div>{user.role}</div>
          </div>
          <div>
            <div className="font-semibold">Accreditations</div>
            <div>{user.accreditations.join(', ') || '—'}</div>
          </div>
          <div>
            <div className="font-semibold">About me</div>
            <div>{user.about || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
