export default function StatCard({ icon: Icon, label, value, color = 'slate' }) {
  const colors = {
    slate: 'text-slate-600 bg-slate-100',
    orange: 'text-orange-600 bg-orange-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    blue: 'text-blue-600 bg-blue-100',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
