// components/ui/LoadingSpinner.tsx
export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      <p className="mt-3 text-gray-600">{message}</p>
    </div>
  );
}