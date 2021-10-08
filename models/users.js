import mongoose from 'mongoose'

const Schema = mongoose.Schema

const userSchema = new Schema(
  {
    name: {
      type: String,
      minlength: [4, '帳號最少 4 個字'],
      // 最大長度，自訂錯誤訊息
      maxlength: [20, '帳號最多 20 個字'],
      required: [true, '缺少帳號欄位'],
      // 不可重複，預設只能放 true 或 false，除非使用套件
      // unique: '帳號重複'
    },
      msg: {
      type: String,
      minlength: [1, '最少 1 個字'],
      // 最大長度，自訂錯誤訊息
      maxlength: [2000, '最多 2000 個字'],
      required: [true, '缺少訊息'],
    }
  },
  {
    versionKey: false
  }
)

const users = mongoose.model('users', userSchema)

export default users
