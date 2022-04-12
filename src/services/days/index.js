const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const { authorize } = require("../auth/middleware");
const dayRauter = express.Router();
const cloudinary = require("../utilities/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const daySchema = require("./daySchema");
const guestSchema = require("../guests/schema");
const apartmentSchema = require("../apartments/schema");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "estateImages",
  },
});

//action can be => toBeCleaned, finished or not finished
dayRauter.put(
  "/updateDate/:action/:dateId",
  authorize,
  async (req, res, next) => {
    try {
      const dateId = req.params?.dateId;
      const day = await daySchema.find({
        _id: mongoose.Types.ObjectId(dateId),
      });
      if (req.params?.action === "finished") {
        try {
          console.log("trying to import booking...");

          const updatedGuest = await guestSchema.findByIdAndUpdate(
            mongoose.Types.ObjectId(req.body.data.guestId),
            {
              $push: { bookings: day },
            }
          );
          console.log("updating guest bookings...", updatedGuest);
          updatedGuest.save();
        } catch (error) {
          next(error);
        }
      }

      console.log(req.params?.action);
      await daySchema.findByIdAndUpdate(dateId, {
        finishStatus: req.params?.action,
      });
      res.send(dateId);
    } catch (e) {
      console.error(e);
      res.send(e);
      next(e);
    }
  }
);

dayRauter.post(
  "/createBooking/:extend?/:dateId?/:apartmentId?",
  authorize,
  async (req, res, next) => {
    try {
      const extender = req.params?.extend;
      const listDate = [];
      const listDate1 = [];
      const startDate = req.body.data.startDate;
      const endDate = req.body.data.endDate;

      const guest = req.body.data.guest;
      const dateMove = new Date(startDate);
      const dateMove2 = new Date(startDate);
      let strDate = startDate;
      let index2 = 0;
      let index = 0;

      let strDate2 = startDate;
      console.log(strDate, "| str------end |", endDate);
      while (strDate2 < endDate) {
        strDate2 = dateMove2.toISOString().slice(0, 10);
        dateMove2.setDate(dateMove2.getDate() + 1);
        index2++;
      }

      while (strDate < endDate) {
        console.log({ ...listDate1[0] });
        strDate = dateMove.toISOString().slice(0, 10);

        console.log(index2 - 1 === index);
        let dateAsObj;
        extender === "false" && index === 0
          ? (dateAsObj = new daySchema({
              day: parseInt(strDate.slice(8, 10)),
              month: parseInt(strDate.slice(5, 7)) - 1,
              year: parseInt(strDate.slice(0, 4)),
              apartmentId: req.body.data.apartmentId,
              apartmentName: req.body.data.apartmentName,
              guest: guest,
              startDate: true,
              endDateObj: endDate,
            }))
          : index2 - 1 === index
          ? (dateAsObj = new daySchema({
              day: parseInt(strDate.slice(8, 10)),
              month: parseInt(strDate.slice(5, 7)) - 1,
              year: parseInt(strDate.slice(0, 4)),
              apartmentId: req.body.data.apartmentId,
              apartmentName: req.body.data.apartmentName,
              guest: guest,
              endDate: true,
              startDateObj: startDate,
            }))
          : (dateAsObj = new daySchema({
              day: parseInt(strDate.slice(8, 10)),
              month: parseInt(strDate.slice(5, 7)) - 1,
              year: parseInt(strDate.slice(0, 4)),
              apartmentId: req.body.data.apartmentId,
              apartmentName: req.body.data.apartmentName,
              guest: guest,
            }));
        index++;
        const checkDay = await daySchema.findOne({
          day: parseInt(strDate.slice(8, 10)),
          month: parseInt(strDate.slice(5, 7)) - 1,
          year: parseInt(strDate.slice(0, 4)),
          apartmentId: req.params?.apartmentId,
        });
        if (checkDay) {
          if (!checkDay?.endDate) {
            res.send(
              `${dateAsObj?.day} / ${dateAsObj?.month} / ${dateAsObj?.year} -> is taken`
            );
            return;
          }
        }
        listDate.push(dateAsObj);
        dateMove.setDate(dateMove.getDate() + 1);
      }
      const listEndIndex = listDate.length - 1;

      for (let x = 0; x <= listEndIndex; x++) {
        listDate[x].save();
        //save it in the selected apartment
        await apartmentSchema.findByIdAndUpdate(listDate[x].apartmentId, {
          $push: { days: listDate[x] },
        });
      }

      console.log("LIST DATE / ", listDate);
      if (extender !== "false") {
        const dateId = req.params?.dateId;
        await daySchema.findByIdAndUpdate(dateId, { finishStatus: "extended" });
        const updatedGuest = await guestSchema.findByIdAndUpdate(
          mongoose.Types.ObjectId(guest._id),
          {
            $push: { bookings: listDate[listEndIndex] },
          }
        );
      }
      res.send(listDate);
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

dayRauter.delete(
  "/deleteBooking/:startDate/:endDate/:id",
  authorize,
  async (req, res, next) => {
    try {
      const startDate = req.params?.startDate;
      const endDate = req.params?.endDate;
      const dateMove = new Date(startDate.replace(/-/g, "/"));
      const apartmentId = req.params?.id;
      let strDate = startDate;
      console.log(strDate, endDate);

      while (strDate < endDate) {
        strDate = dateMove.toISOString().slice(0, 10);

        const dateAsObj = {
          day: parseInt(strDate.slice(8, 10)),
          month: parseInt(strDate.slice(5, 7)) - 1,
          year: parseInt(strDate.slice(0, 4)),
          apartmentId: apartmentId,
        };
        const dateId = await daySchema.findOneAndDelete(dateAsObj);
        console.log(dateId);
        dateMove.setDate(dateMove.getDate() + 1);
      }
      res.send("Deleted");
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

dayRauter.get(
  "/getDays/:id/:month/:year",
  authorize,
  async (req, res, next) => {
    try {
      const days = await daySchema.find({
        apartmentId: req.params.id,
      });

      // await daySchema.find({
      //   apartmentId:
      //   month: req.params.month,
      //   year: req.params.year,
      // });
      res.send(days);
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

dayRauter.get("/getDailyManagerDays", authorize, async (req, res, next) => {
  try {
    const today = new Date();

    const startDays = await daySchema.find({
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      startDate: true,
    });
    const endDays = await daySchema.find({
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      endDate: true,
    });
    res.send({ startDays: startDays, endDays: endDays });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

module.exports = dayRauter;
