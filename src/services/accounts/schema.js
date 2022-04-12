const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const AccountSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    favourites: {
      type: Array,
      required: false,
      default: [],
    },
    notes: {
      type: Array,
      required: false,
      default: [],
    },
    tokens: [
      {
        token: {
          type: String,
        },
        refreshToken: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

AccountSchema.statics.findByCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email: email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};
AccountSchema.statics.getOnlineUsers = async function () {
  const users = await this.find({ online: true });
  if (users) {
    return users;
  } else {
    return "no users online";
  }
};

const AccountModel = model("Accounts", AccountSchema);

module.exports = AccountModel;
