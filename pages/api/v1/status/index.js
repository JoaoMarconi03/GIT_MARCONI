import database from "../../../../infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toLocaleString("pt-BR");
  response.status(200).json({
    data_atual: updatedAt,
  });
}

export default status;
