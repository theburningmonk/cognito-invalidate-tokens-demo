module.exports.handler = async (event) => {
  console.log(JSON.stringify(event, 2, null));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'you are authenticated',     
    }),
  };
};