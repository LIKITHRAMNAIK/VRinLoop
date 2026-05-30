export const formatCurrency = (amount) => {
  if (!amount) return "₹0";

  return "₹" + Number(amount).toLocaleString("en-IN");
};
