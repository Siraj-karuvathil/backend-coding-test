module.exports = function (data) {
  const rideID = data.filter((item) => item.json).map((item) => item.json)[0];
  return { rideID };
};
