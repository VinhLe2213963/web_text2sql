export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex space-x-2 mb-4">
        <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
        <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
      </div>
      <span className="text-lg text-gray-700">Loading...</span>
    </div>
  );
}
