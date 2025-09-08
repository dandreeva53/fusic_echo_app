'use client';
import SignaturePad from 'signature_pad';
import { useEffect, useRef } from 'react';

export default function SignatureCanvas({ onSave }: { onSave: (blob: Blob)=>void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const pad = new SignaturePad(ref.current);
    return () => pad.off();
  }, []);
  return (
    <div>
      <canvas ref={ref} className="border rounded w-full h-60 bg-white" />
      <button
        className="btn mt-2"
        onClick={async () => {
          if (!ref.current) return;
          ref.current.toBlob((b)=> b && onSave(b) , 'image/png');
        }}
      >Save signature</button>
    </div>
  );
}
