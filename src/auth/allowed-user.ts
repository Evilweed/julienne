const allowedExternalUsers = ['j.maciejewski@ideamotive.co']

export const allowedUser = user => {
  if (allowedExternalUsers.indexOf(user.email) > -1) {
    return true
  }
  return /.*packhelp\.com/.test(user.email)
}
