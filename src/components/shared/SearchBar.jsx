import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full h-12 pl-12 pr-4 rounded-2xl
          bg-slate-100 border-2 border-transparent
          text-slate-700 placeholder:text-slate-400
          focus:outline-none focus:bg-white focus:border-orange-300
          text-base
        "
      />
    </div>
  );
}
