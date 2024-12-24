const capitalize = (string) => {
  let strings = string.split(" ");
  strings.forEach((s, i) => {
    strings[i] = s.slice(0, 1).toUpperCase() + s.slice(1)
  });
  strings = strings.reduce((string, current) => string + current + " " , "");
  return strings.trim();
}

module.exports = {capitalize};

// const pruebas = [{ text: "hello", user: "pepito"}, { text: "hello", user: "pepito"}, { text: "hello", user: "pepito"}];

// console.log(pruebas.find(message => {
//   return message.user === "pepito";
// }))