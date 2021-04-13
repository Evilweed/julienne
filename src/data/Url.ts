export class Url {
  static get clubhouse() {
    return ClubhouseUrl;
  }
  static get ci() {
    return CiUrl;
  }
}

class ClubhouseUrl {
  static search(term) {
    return `https://app.clubhouse.io/packhelp/search#%22${term}%22`;
  }
  static story(id) {
    return `https://app.clubhouse.io/packhelp/story/${id}/`;
  }
}

class CiUrl {
  static pipeline(id) {
    return `https://github.com/packhelp/packhelp/actions/runs/${id}`;
  }
}
