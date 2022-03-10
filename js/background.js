chrome.runtime.onInstalled.addListener(() => {
    console.log('Google Scholar Scrapper Extension is running!');
    // //on init set the boolean false on the extension storage
    // chrome.storage.sync.set({ 'yes_no': false }, function () {
    //     console.log('The autocopy is disabled');
    // });
});



function parse() {

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text is copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
    console.log('parse.js is running!');

    article_box = document.body.querySelector("#gs_res_ccl_mid");

    article_item_list = article_box.querySelectorAll(".gs_ri");

    article_info_list = [];

    for (article_item of article_item_list) {
        article_info_dict = {};

        // Get title
        title = article_item.querySelector(".gs_rt").innerText;
        title = title.replace(/^\[.+\]\s+/, "");
        article_info_dict["title"] = title;

        // Get authors, Journal, Year, and Domain
        author_line = article_item.querySelector(".gs_a").innerText;

        tokens_in_author_line = author_line.split(/\s\-\s/);
        if (tokens_in_author_line.length == 3) {
            authors = tokens_in_author_line[0];
            journal_and_year = tokens_in_author_line[1];
            domain = tokens_in_author_line[2];
        } else {
            authors = author_line;
            journal_and_year = "";
            domain = "";
        }
        article_info_dict["domain"] = domain;

        // parse authors, then get the first author
        if (authors.indexOf(",") != -1) {
            authors_list = authors.split(",");
            authors_list = authors_list.map(author => author.trim());
            first_author = authors_list[0];
        } else {
            first_author = authors;
        }
        article_info_dict["first_author"] = first_author;


        // parse journal_and_year, then get the journal and year
        if (journal_and_year.indexOf(",") != -1) {
            journal_and_year_list = journal_and_year.split(",");
            journal_and_year_list = journal_and_year_list.map(journal_and_year => journal_and_year.trim());
            journal = journal_and_year_list[0];
            year = journal_and_year_list[1];
        } else {
            if (journal_and_year.trim().match(/^\d{4}$/)) {
                year = journal_and_year.trim();
                journal = "";
            } else {
                journal = journal_and_year.trim();
                year = "";
            }
        }
        article_info_dict["journal"] = journal;
        article_info_dict["year"] = year;
        article_info_dict["authors"] = authors;

        // get abstract
        abstract = article_item.querySelector(".gs_rs").innerText;
        // remove a new line in the abstract
        abstract = abstract.replace(/\n/g, "");
        article_info_dict["abstract"] = abstract;

        // get link
        link = article_item.querySelector(".gs_rt a").href;
        article_info_dict["link"] = link;

        // get citation count
        citation_count_fullstring = article_item.querySelectorAll(".gs_fl a")[2].innerText;
        citation_count = citation_count_fullstring.replace(/\D/g, "");
        article_info_dict["citation_count"] = citation_count;

        article_info_list.push(article_info_dict);
    }

    function buildText(article_info_list) {
        text = "";
        for (article_info of article_info_list) {
            text += article_info["title"] + "\t";
            text += article_info["first_author"] + "\t";
            text += article_info["journal"] + "\t";
            text += article_info["year"] + "\t";
            text += article_info["domain"] + "\t";
            text += article_info["abstract"] + "\t";
            text += article_info["link"] + "\t";
            if (article_info == article_info_list[article_info_list.length - 1]) {
                text += article_info["citation_count"];
            } else {
                text += article_info["citation_count"] + "\n";
            }
        }
        return text;
    }

    copyTextParagraph = buildText(article_info_list);
    copyText(copyTextParagraph);

    return {
        article_info_list: article_info_list
    };
}

function tab_update(tabId, changeInfo, tab) {
    // read changeInfo data and do something with it (like read the url)
    if (changeInfo.url) {
        // do something here
        // console.log(tabId, tab, changeInfo, changeInfo.url);

        if (changeInfo.url.startsWith('https://scholar.google.com/')) {
            // console.log(tab, changeInfo, tabId, 'scholar.google.com');
            console.log("executing script in tab: ", tabId);
            
            // do the thing
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: parse
            },
                (list_of_papers) => {
                    console.log("script executed");
                    console.log(list_of_papers);
                });
        }
    }
}


chrome.tabs.onUpdated.addListener(tab_update);