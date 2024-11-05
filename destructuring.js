const response = {
  title: "pantalon",
  condition: "presque neuf",
  description: "trop bien",
  price: "20",
  city: "madrid",
  brand: "h&m",
  size: "XL",
  color: "rouge",
};
// pour destructurer un objet, il faut faire correspondre les noms de variables avec les clefs de l'objet en question
// les noms de variables sont donc IMPOSEES
const { title, description, city, color, size } = response;

console.log(title);

// console.log(response.data.description);
// console.log(response.data.price)

// pour destructurer un tableau, il faut faire correspondre l'ordre des noms de variables avec l'ordre des élméments dans le tableau en question
// l'ordre des variables est donc IMPOSE
const req = [34, "Lucas", "Paris", 75020];

const [age, name, town, zipCode] = req;

console.log(name); // affiche Lucas
