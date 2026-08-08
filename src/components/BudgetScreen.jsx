const BudgetScreen = ({ history, wasteHistory, inventory = [] }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyHistory = history.filter((h) => {
    const d = h.timestamp?.toDate ? h.timestamp.toDate() : new Date();
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSpent = monthlyHistory.reduce(
    (acc, curr) => acc + (parseFloat(curr.cost) || 0),
    0
  );
  const monthlyWaste = wasteHistory.filter((w) => {
    const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date();
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalWasted = monthlyWaste.reduce(
    (acc, curr) => acc + (parseFloat(curr.cost) || 0),
    0
  );
  const [budgetGoal, setBudgetGoal] = useState(
    parseFloat(localStorage.getItem("budget_goal") || "500")
  );
  const handleSetBudget = (val) => {
    setBudgetGoal(val);
    localStorage.setItem("budget_goal", val);
  };
  const catSpend = monthlyHistory.reduce((acc, curr) => {
    const cat = curr.category || "Other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(curr.cost) || 0);
    return acc;
  }, {});
  

  const sortedCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
  const maxSpend = sortedCats.length > 0 ? sortedCats[0][1] : 1;
  const progress = Math.min((totalSpent / budgetGoal) * 100, 100);

  {/* Pantry Asset Value Summary on Budget Page */}
  const totalPantryWorth = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (parseFloat(item.lastCost) || 2.00) * (item.quantity || 1), 0);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Top Spent Card */}
      <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Total Spent
              </p>
              <h2 className="text-4xl font-black">${totalSpent.toFixed(2)}</h2>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Wasted Value
              </p>
              <h2 className="text-2xl font-bold text-red-300">
                -${totalWasted.toFixed(2)}
              </h2>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-indigo-100 font-medium">
              <span>Budget Progress</span>
              <span>${(budgetGoal - totalSpent).toFixed(2)} left</span>
            </div>
            <div className="w-full bg-indigo-900/30 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress > 90 ? "bg-red-400" : "bg-green-400"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Pantry Capital & Asset Valuation Card */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Pantry Assets</p>
            <h3 className="text-2xl font-black text-gray-900">${totalPantryWorth.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your pantry represents an active store of food currency. By consuming oldest stock first and tracking items before they expire, you protect this capital from turning into waste.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">
          Monthly Budget Goal:
        </span>
        <div className="flex items-center">
          <span className="text-sm font-bold text-gray-400 mr-1">$</span>
          <input
            type="number"
            value={budgetGoal}
            onChange={(e) => handleSetBudget(parseFloat(e.target.value))}
            className="w-20 p-1 border border-gray-200 rounded text-sm font-bold text-right outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      {totalWasted > 0 && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <h3 className="font-bold text-red-800 mb-2 flex items-center text-sm">
            <Trash2 className="w-4 h-4 mr-2" /> Waste Report
          </h3>
          <div className="space-y-2">
            {monthlyWaste.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="flex justify-between text-xs text-red-700 bg-white/50 p-2 rounded-lg"
              >
                <span>{w.name} (Spoiled)</span>
                <span className="font-bold">-${w.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Spending by Category
        </h3>
        {sortedCats.length > 0 ? (
          <div className="space-y-3">
            {sortedCats.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>{cat}</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${(amount / maxSpend) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-xs py-4">
            No spending recorded yet.
          </p>
        )}
      </div>
      <div className="bg-white p-4 rounded-3xl border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">
          Recent Transactions
        </h3>
        <div className="space-y-2">
          {history.slice(0, 10).map((h) => (
            <div
              key={h.id}
              className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-700">{h.name}</span>
              <div className="text-right">
                <span className="block font-bold text-indigo-600">
                  -${parseFloat(h.cost).toFixed(2)}
                </span>
                <span className="text-gray-400 text-[10px]">
                  {h.timestamp?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};