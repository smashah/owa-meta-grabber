const cheerio = require("cheerio");
const axios = require("axios");
const usage = "https://metagrabber.vercel.app/api?url=https://discord.com"
const titleRegexp = /<title>(.*?)<\/title>/g
const descriptionRegex = /<meta.*name="description" content="([^\>]*)"[^\>]*\/>/g
// (.exec(s)[1]).replaceAll("&amp;","&")

async function meta(urrl) {
      const page = (await axios.get(urrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36"
        }
      })).data;
      const $ = cheerio.load(page);
      const isAmzn = urrl.includes("amazon.") || urrl.includes("amzn.");
      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content') || titleRegexp.exec($.html()) && titleRegexp.exec($.html())[1]
      const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || descriptionRegex.exec($.html()) && descriptionRegex.exec($.html())[1]
      const url = $('meta[property="og:url"]').attr('content')
      const site_name = isAmzn ? "Amazon" : $('meta[property="og:site_name"]').attr('content')
      let image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
      if(isAmzn) {
        const amazonImageMatches = $.html().match(/https:\/\/m.media-amazon.com\/images\/I\/[^;"]*_.jpg/g)
        if(amazonImageMatches) image = amazonImageMatches.filter(img=>!img.includes(","))[0]
      }
      const icon = isAmzn ? `https://www.amazon.com/favicon.ico` : $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href')
      if(!image) image = icon
      image = (image || "").replace(/amp;/g,"");
      const keywords = $('meta[property="og:keywords"]').attr('content') || $('meta[name="keywords"]').attr('content')
      const json = { title, description, url : url || urrl, site_name, image: image || icon, icon, keywords };
      console.log(json)
      return json;
}

/**
 * TEST URLS
 */
// meta("https://www.amazon.in/gp/product/B0948NNY3W?th=1")
// meta("https://amzn.to/39jZfzw")
// meta("https://amzn.to/3HyQ8aQ")
// meta("https://www.amazon.in/s?i=apparel")
// meta("https://www.amazon.co.uk/DJI-Mic-Smartphones-Dual-Channel-Transmission/dp/B09GYD9DMZ")
// meta("https://github.com/open-wa/wa-automate-nodejs")

module.exports = async (request, response) => {
  const { url } = request.query;
  if (!url || url == "" || url == " ") {
    response.status(400).json({
      "success": false,
      "error": "No url query specified.",
      "usage": usage
    });
  } else {
    try {
      let metaRes = await meta(url)
      metaRes.success = true
      response.status(200).json(metaRes);
    } catch (error) {
        response.status(400).json({
          "success": false,
          url,
          erData: error,
          erMessage: error.message,
          "error": "The server encountered an error. You may have inputted an invalid query.",
          "usage": usage
       });
    }
  }
}
