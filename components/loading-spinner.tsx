export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-3 border-line border-t-primary rounded-full animate-spin" />
    </div>
  );
}