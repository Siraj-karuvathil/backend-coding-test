"use strict";

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

module.exports = (db) => {
  app.get("/health", (req, res) => res.send("Healthy"));

  app.post("/rides", jsonParser, async (req, res) => {
    const startLatitude = Number(req.body.start_lat);
    const startLongitude = Number(req.body.start_long);
    const endLatitude = Number(req.body.end_lat);
    const endLongitude = Number(req.body.end_long);
    const riderName = req.body.rider_name;
    const driverName = req.body.driver_name;
    const driverVehicle = req.body.driver_vehicle;

    if (
      startLatitude < -90 ||
      startLatitude > 90 ||
      startLongitude < -180 ||
      startLongitude > 180
    ) {
      return res.send({
        error_code: "VALIDATION_ERROR",
        message:
          "Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively",
      });
    }

    if (
      endLatitude < -90 ||
      endLatitude > 90 ||
      endLongitude < -180 ||
      endLongitude > 180
    ) {
      return res.send({
        error_code: "VALIDATION_ERROR",
        message:
          "End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively",
      });
    }

    if (typeof riderName !== "string" || riderName.length < 1) {
      return res.send({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    if (typeof driverName !== "string" || driverName.length < 1) {
      return res.send({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    if (typeof driverVehicle !== "string" || driverVehicle.length < 1) {
      return res.send({
        error_code: "VALIDATION_ERROR",
        message: "Rider name must be a non empty string",
      });
    }

    var values = [
      req.body.start_lat,
      req.body.start_long,
      req.body.end_lat,
      req.body.end_long,
      req.body.rider_name,
      req.body.driver_name,
      req.body.driver_vehicle,
    ];

    try {
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)",
          values,
          function (err) {
            if (err) {
              return reject({
                error_code: "SERVER_ERROR",
                message: "Unknown error",
              });
            }
            resolve();
          }
        );
      });

      const rows = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM Rides WHERE rideID = ?",
          this.lastID,
          function (err, rows) {
            if (err) {
              return reject({
                error_code: "SERVER_ERROR",
                message: "Unknown error",
              });
            }
            resolve(rows);
          }
        );
      });

      res.send(rows);
    } catch (err) {
      res.send(err);
    }
  });

  // Functional functions
  async function getRides(limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM Rides LIMIT ${limit} OFFSET ${offset}`,
        (err, rows) => {
          if (err) {
            reject({
              error_code: "SERVER_ERROR",
              message: "Unknown error",
            });
          } else if (rows.length === 0) {
            reject({
              error_code: "RIDES_NOT_FOUND_ERROR",
              message: "Could not find any rides",
            });
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async function getRideById(id) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Rides WHERE rideID='${id}'`, (err, rows) => {
        if (err) {
          reject({
            error_code: "SERVER_ERROR",
            message: "Unknown error",
          });
        } else if (rows.length === 0) {
          reject({
            error_code: "RIDES_NOT_FOUND_ERROR",
            message: "Could not find any rides",
          });
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Imperative functions
  app.get("/rides", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10; // default limit is 10
      const offset = req.query.offset ? parseInt(req.query.offset) : 0; // default offset is 0
      const rows = await getRides(limit, offset);
      res.send(rows);
    } catch (error) {
      res.send(error);
    }
  });

  app.get("/rides/:id", async (req, res) => {
    try {
      const rows = await getRideById(req.params.id);
      res.send(rows);
    } catch (error) {
      res.send(error);
    }
  });

  return app;
};
