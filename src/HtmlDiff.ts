interface IgnoreTag {
  openTag: string;
  closeTag: string;
  flag: boolean;
}

class HtmlDiff {
  ignore_tag: IgnoreTag[];
  Diff_Timeout: number;

  constructor() {
    this.ignore_tag = [];
    this.Diff_Timeout = 0;
  }

  diff_launch(
    html1: string,
    html2: string,
  ): { time: number; diffHtml: string } {
    const text1 = this.convertTextFromHtml(html1);
    const text2 = this.convertTextFromHtml(html2);

    const dmp = new diff_match_patch();
    dmp.Diff_Timeout = this.Diff_Timeout;
    const ms_start = Date.now();
    const diff = dmp.diff_main(text1, text2, true);
    const ms_end = Date.now();

    const time = ms_end - ms_start;

    const diffHtml = this.restoreToHtml(html2, diff);
    return { time, diffHtml };
  }

  restoreToHtml(
    originalHtml: string,
    diffResultList: [number, string][],
  ): string {
    let diffHtml = "";
    while (true) {
      // eslint-disable-next-line prefer-const
      let { tag, text } = this.getOneTextFromHtml(originalHtml);
      diffHtml += tag;
      originalHtml = originalHtml.substr(tag.length + text.length);
      for (let i = 0, len = diffResultList.length; i < len; i++) {
        const diffType = diffResultList[i][0];
        const diffText = diffResultList[i][1];
        if (diffType === -1) {
          diffHtml += this.formatText(diffType, diffText);
          diffResultList.splice(i, 1);
          i--;
          len--;
          continue;
        }
        if (diffText === text) {
          diffHtml += this.formatText(diffType, diffText);
          diffResultList.splice(i, 1);
          break;
        }
        if (diffText.length > text.length) {
          diffHtml += this.formatText(diffType, text);
          diffResultList[i][1] = diffText.substr(text.length);
          break;
        }
        if (text.length > diffText.length) {
          diffHtml += this.formatText(diffType, diffText);
          text = text.substr(diffText.length);
          diffResultList.splice(i, 1);
          i--;
          len--;
        }
      }
      if (!originalHtml || !diffResultList || diffResultList.length <= 0) {
        break;
      }
    }
    for (let i = 0, len = diffResultList.length; i < len; i++) {
      diffHtml += this.formatText(diffResultList[i][0], diffResultList[i][1]);
    }
    return diffHtml + originalHtml;
  }

  convertTextFromHtml(html: string): string {
    let text = "";
    let tagFlag = false;
    this.ignore_tag.map((item) => {
      item.flag = false;
    });
    for (let i = 0, len = html.length; i < len; i++) {
      if (!tagFlag && html[i] === "<") {
        tagFlag = true;
        this.ignore_tag.map((item) => {
          if (html.substr(i + 1, item.openTag.length) === item.openTag) {
            item.flag = true;
          }
        });
      } else if (tagFlag && html[i] === ">") {
        tagFlag = false;
        this.ignore_tag.map((item) => {
          if (
            item.flag &&
            html.substring(i - item.closeTag.length, i) === item.closeTag
          ) {
            item.flag = false;
          }
        });
        continue;
      }
      let notDiffFlag = false;
      this.ignore_tag.map((item) => {
        if (item.flag) {
          notDiffFlag = true;
        }
      });
      if (!tagFlag && !notDiffFlag) {
        text += html[i];
      }
    }
    return text;
  }

  getOneTextFromHtml(html: string): { tag: string; text: string } {
    let tag = "";
    let text = "";
    let tagFlag = false;
    this.ignore_tag.map((item) => {
      item.flag = false;
    });
    for (let i = 0, len = html.length; i < len; i++) {
      if (!tagFlag && html[i] === "<") {
        tagFlag = true;
        if (text) {
          return { tag, text };
        }
        this.ignore_tag.map((item) => {
          if (html.substr(i + 1, item.openTag.length) === item.openTag) {
            item.flag = true;
          }
        });
      } else if (tagFlag && html[i] === ">") {
        tagFlag = false;
        tag += html[i];
        this.ignore_tag.map((item) => {
          if (
            item.flag &&
            html.substring(i - item.closeTag.length, i) === item.closeTag
          ) {
            item.flag = false;
          }
        });
        continue;
      }
      let notDiffFlag = false;
      this.ignore_tag.map((item) => {
        if (item.flag) {
          notDiffFlag = true;
        }
      });
      if (!tagFlag && !notDiffFlag) {
        text += html[i];
      } else {
        tag += html[i];
      }
    }
    return { tag, text };
  }

  formatText(diffType: number, diffText: string): string {
    if (diffType === 0) {
      return diffText;
    } else if (diffType === -1) {
      return "<s style='color: #fd1a1c'>" + diffText + "</s>";
    } else {
      return "<u style='color: #6efd3e'>" + diffText + "</u>";
    }
  }
}

export { HtmlDiff };
