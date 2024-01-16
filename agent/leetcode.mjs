import urls from "./leetcodeProblems.mjs";
import puppeteer from 'puppeteer';
import chalk from 'chalk';
const log = console.log;

for (const url of urls) {
  await solve(url);
}


async function solve(url) {
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });

  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForNetworkIdle();
  // wait for 2 more seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  log(chalk.blue('Page loaded:', url));
  // Get the content inside the div
//   const element = await page.$x('/html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[3]/div[2]');
  const element = await page.$x('html/body/div[1]/div[2]/div/div/div[2]/div/div/div[4]/div/div[1]/div[3]');
  // console.log(element)
  const text = await page.evaluate(el => el.textContent, element[0]);
  log(chalk.blue('Question detected: ' + text));
  // Get the content inside the div: /html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[4]
//   const element2 = await page.$x('/html[1]/body[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[4]');
  const element2 = await page.$x('/html/body/div[1]/div[2]/div/div/div[2]/div/div/div[8]/div/div[2]/div[1]/div/div/div[1]/div[2]/div[1]/div[4]');
  const text2 = await page.evaluate(el => el.textContent, element2[0]);
  log(chalk.blue('Code template detected:'+ text2));


//   const btn = await page.$x("//button[contains(text(),'Submit')]")
//   const btn = await page.$('[data-e2e-locator="console-submit-button"]')


  const btn = await page.$x('//*[@data-e2e-locator="console-submit-button"]');
    if (btn.length == 0) {
        console.log('Button not found');
        return
    }

  log(chalk.red('Asking LLM...'));

   const base_url = 'http://172.26.1.16:31251/v1'
//   const api_key = 'sk-'
// const model_name = "modelscope/qwen/Qwen-14B-Chat"

  const api_key = 'OpenRL-ashgfwdadfyafgafsfnthabq'
  const model_name = "OpenRL/azure/gpt4-1106-preview"


  const language = "python"
  const data = {
    "model": model_name,
    "messages": [
      {
        "role": "user",
        "content": `${text}

Complete the following ${language} function for me

\`\`\`${language}
${text2}
\`\`\`
        `
      }
    ]
  };



  const res = await fetch(`${base_url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  const resJSON = await res.json();
  // console.log(resJSON)
  const content = resJSON.choices[0].message.content;
  log(chalk.blue('Model responded'));
  log(chalk.red("Response:"+content));

  log(chalk.blue('Filling in the code...'));

  // find the js code inside content
  const start = content.indexOf(`\`\`\`${language}`);
  const end = content.indexOf('```', start + 1);
  const code = content.substring(start + 3+ language.length, end);

  log("start:",start)
  log("end:",end)
  log("Code:",code)
//   exit(0)
  // remove indents from code
  const codeWithoutIndent = code.split('\n').map(line => line.trim()).join('\n');

  await page.click('div.view-lines > div.view-line')

  // Select all the text inside the element
  await page.keyboard.down('Meta', { delay: 200 });
  await page.keyboard.press('a', { delay: 200 });
  await page.keyboard.up('Meta');

  for (let char of codeWithoutIndent) {
    await page.keyboard.type(char);
    await page.keyboard.press('Delete');
  }
  await btn[0].click();

  log(chalk.green('Answer submitted'));

  // wait for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  log(chalk.green('Answer Accepted!'));
}