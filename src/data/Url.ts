export class Url {
  static get clubhouse() { return ClubhouseUrl }
  static get ci() { return CiUrl }
}

class ClubhouseUrl {
  static search(term) { return `https://app.clubhouse.io/packhelp/search#%22${term}%22`;}
  static story(id) { return `https://app.clubhouse.io/packhelp/story/${id}/`;}
}

class CiUrl {
  static job(id) { return `https://gitlab.com/packhelp-devs/packhelp/-/jobs/${id}`;}
  static pipeline(id) { return `https://gitlab.com/packhelp-devs/packhelp/-/pipelines/${id}`;}
}
