const date = new Date();
console.log(date); // 2026-10-30T09:00:13.127Z

const millisecondes = date.getTime();
console.log(millisecondes); // 1793350813127

const obj = {};

obj.name = "Alexis";

console.log(obj); // { name: 'Alexis' }

obj.address = {};
obj.address.street = "Rue de Paris";
console.log(obj); // { name: 'Alexis', address: { street: 'Rue de Paris' } }
