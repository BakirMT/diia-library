const fs = require('fs');

let content = fs.readFileSync('src/pages/fines.tsx', 'utf8');

const oldModalUI = `<div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Amount ({settings.currencySymbol})</label>
                <Input 
                  type="number" 
                  min="0.01" 
                  max={payingFineMember.finesDue} 
                  step="0.01" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)} 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>`;

const newModalUI = `<div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  variant={parseFloat(paymentAmount) === payingFineMember.finesDue ? "default" : "outline"} 
                  className={parseFloat(paymentAmount) === payingFineMember.finesDue ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" : "flex-1 text-slate-600"}
                  onClick={() => setPaymentAmount(payingFineMember.finesDue.toFixed(2))}
                >
                  Pay Full
                </Button>
                <Button 
                  variant={parseFloat(paymentAmount) !== payingFineMember.finesDue ? "default" : "outline"} 
                  className={parseFloat(paymentAmount) !== payingFineMember.finesDue ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" : "flex-1 text-slate-600"}
                  onClick={() => setPaymentAmount('')}
                >
                  Partial Pay
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Amount to Pay ({settings.currencySymbol})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{settings.currencySymbol}</span>
                  <Input 
                    type="number" 
                    min="0.01" 
                    max={payingFineMember.finesDue} 
                    step="0.01" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="pl-8"
                  />
                </div>
                {parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < payingFineMember.finesDue && (
                  <p className="text-xs text-amber-600 flex items-center mt-1">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Remaining balance will be {settings.currencySymbol}{(payingFineMember.finesDue - parseFloat(paymentAmount)).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Google Pay (GPay)">Google Pay (GPay)</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>`;

content = content.replace(oldModalUI, newModalUI);

fs.writeFileSync('src/pages/fines.tsx', content);
