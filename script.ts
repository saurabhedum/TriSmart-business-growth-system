import fs from 'fs';

const fileLines = fs.readFileSync('src/views/ExpensesView.tsx', 'utf-8').split('\n');
const fixedLines = fileLines.map(line => {
  if (line.includes('${expense.amount.toFixed(2)}')) {
    return line.replace('${expense.amount.toFixed(2)}', '₹{expense.amount.toFixed(2)}');
  }
  if (line.includes('DollarSign className="w-4 h-4 absolute left-4 bottom-4')) {
    return line.replace('DollarSign', 'IndianRupee');
  }
  if (line.includes('DollarSign } from \'lucide-react\'')) {
    return line.replace('DollarSign }', 'DollarSign, IndianRupee }');
  }
  return line;
});
fs.writeFileSync('src/views/ExpensesView.tsx', fixedLines.join('\n'));
console.log('Fixed ExpensesView');
