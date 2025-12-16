console.log("ENTRÉ AL SCRIPT");
const bcrypt = require("bcryptjs");

(async () => {
  const hash = await bcrypt.hash("Profe123", 10);
  console.log("HASH:", hash);
})();
