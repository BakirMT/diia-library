const fs = require('fs');

let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

const oldModalUI = `<select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>`;

const newModalUI = `<select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                </select>`;

content = content.replace(oldModalUI, newModalUI);

fs.writeFileSync('src/pages/fines.tsx', content);
