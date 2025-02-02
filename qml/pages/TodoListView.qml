/*
 * This file is part of harbour-todolist.
 * SPDX-FileCopyrightText: 2020-2024 Mirian Margiani
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import QtQuick 2.0
import Sailfish.Silica 1.0
import Opal.Tabs 1.0
import Opal.MenuSwitch 1.0
import SortFilterProxyModel 0.2
import "../components"

TabItem {
    id: root
    flickable: todoList

    property bool arrangeEntries: arrangeToggle.checked

    TodoList {
        id: todoList
        model: currentEntriesModel
        anchors.fill: parent

        header: Column {
            width: parent.width

            PageHeader {
                title: currentProjectName
            }

            TodoListItemAdder {
                id: adder
                onApplied: {
                    textField.forceActiveFocus()
                    focusTimer.restart()
                }

                Timer {
                    id: focusTimer
                    interval: 80
                    onTriggered: {
                        adder.textField.forceActiveFocus()
                    }
                }
            }
        }

        function addItem() {
            var dialog = pageStack.push(addComponent, { date: lastSelectedCategory })
            dialog.accepted.connect(function() {
                main.addItem(dialog.date, dialog.text.trim(), dialog.description.trim());
                main.lastSelectedCategory = dialog.date
            });
        }

        Component {
            id: addComponent
            AddItemDialog {
                SectionHeader { text: qsTr("Note") }
                Label {
                    anchors {
                        left: parent.left; right: parent.right;
                        leftMargin: Theme.horizontalPageMargin; rightMargin: Theme.horizontalPageMargin;
                    }
                    wrapMode: Text.WordWrap
                    color: Theme.highlightColor
                    text: qsTr("Swipe left to add recurring entries. You can specify an interval "
                               + "in which they will be added automatically to the current to-do list.")
                }
            }
        }

        PullDownMenu {
            MenuItem {
                text: qsTr("About and Archive",
                           "as in “show me the 'About page' and " +
                           "the 'Archive page'”")
                onClicked: pageStack.push(Qt.resolvedUrl("AboutPage.qml"))
            }
            MenuSwitch {
                id: arrangeToggle
                text: qsTr("Arrange entries")
            }
            MenuItem {
                text: qsTr("Add entry")
                onClicked: todoList.addItem()
            }
        }

        footer: Spacer { }
    }
}
