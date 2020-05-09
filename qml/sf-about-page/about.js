.pragma library
// This script is a library. This improves performance, but it means that no
// variables from the outside can be accessed.


// -- TRANSLATORS
// Please add yourself to the list of contributors. If your language is already
// in the list, add your name to the 'values' field:
//     example: {label: qsTr("Your language"), values: ["Existing contributor", "YOUR NAME HERE"]},
//
// If you added a new translation, create a new section at the top of the list:
//     example:
//          var TRANSLATIONS = [
//              {label: qsTr("Your language"), values: ["YOUR NAME HERE"]},
//          [...]
//
var TRANSLATIONS = [
    {label: qsTr("Polish"), values: ["atlochowski"]},
    {label: qsTr("Swedish"), values: ["Åke Engelbrektson"]},
    {label: qsTr("Chinese"), values: ["dashinfantry"]},
    {label: qsTr("German"), values: ["Mirian Margiani"]},
]


// -- OTHER CONTRIBUTORS
// Please add yourself the the list of contributors.
var DEVELOPMENT = [
    {label: qsTr("Programming"), values: ["Mirian Margiani", "Johannes Bachmann"]},
]


var _NOT_YET_NEEDED = [
    {label: qsTr("Icon Design"), values: ["Mirian Margiani"]},
    // ---
    {label: qsTr("English"), values: ["Mirian Margiani"]},
]

var VERSION_NUMBER // set in main.qml's Component.onCompleted
var APPINFO = {
    appName: qsTr("Todo List"),
    iconPath: "../images/harbour-todolist.png",
    description: qsTr("A simple tool for planning what to do next."),
    author: "Mirian Margiani",
    dataInformation: "",  // if your app uses data from an external provider, add e.g. copyright
                          // info here
    dataLink: "",         // a link to the website of an external provider
    dataLinkText: "",     // custom button text
    sourcesLink: "https://github.com/ichthyosaurus/harbour-todolist",
    sourcesText: qsTr("Sources on GitHub"),

    enableContributorsPage: true, // whether to enable 'ContributorsPage.qml'
    contribDevelopment: DEVELOPMENT,
    contribTranslations: TRANSLATIONS
}

function aboutPageUrl() {
    return Qt.resolvedUrl("AboutPage.qml");
}

function pushAboutPage(pageStack) {
    APPINFO.versionNumber = VERSION_NUMBER;
    pageStack.push(aboutPageUrl(), APPINFO);
}
