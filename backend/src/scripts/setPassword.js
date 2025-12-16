require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../db/sequelize");

(async () => {
  const email = "profesor@danzas.com";
  const newPassword = "123456";

  try {
    await sequelize.authenticate();

    const hash = await bcrypt.hash(newPassword, 10);

    const [result] = await sequelize.query(
      "UPDATE profesores SET password_hash = :hash WHERE email = :email",
      { replacements: { hash, email } }
    );

    console.log("OK. Password actualizado para:", email);
    console.log("Resultado:", result);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
