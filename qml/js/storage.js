/*
 * This file is part of harbour-todolist.
 * Copyright (C) 2020  Mirian Margiani
 *
 * This file is based on storage.js from harbour-meteoswiss (same author),
 * which is also released under the GNU GPL v3+.
 *
 * harbour-todolist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * harbour-todolist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with harbour-todolist.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

.pragma library
.import QtQuick.LocalStorage 2.0 as LS
.import "../constants/EntryState.js" as EntryState
.import "../constants/EntrySubState.js" as EntrySubState

function defaultFor(arg, val) { return typeof arg !== 'undefined' ? arg : val; }

var initialized = false

function getDatabase() {
    var db = LS.LocalStorage.openDatabaseSync("harbour-todolist", "1.0", "Todo List Data", 1000000);

    if (!initialized) {
        initialized = true;
        doInit(db);
    }

    return db;
}

function doInit(db) {
    // Database tables: (primary key in all-caps)
    // entries: ID, date, entryState, subState, createdOn, weight, interval, category, text, description
    // categories: ID, name, entryState

    db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS entries(\
            date STRING NOT NULL,
            entryState INTEGER NOT NULL,
            subState INTEGER NOT NULL,
            createdOn STRING NOT NULL,
            weight INTEGER NOT NULL,
            interval INTEGER NOT NULL,
            category INTEGER NOT NULL,
            text TEXT NOT NULL,
            description TEXT
        );');
        tx.executeSql('CREATE TABLE IF NOT EXISTS categories(\
            name TEXT NOT NULL,
            entryState INTEGER NOT NULL
        );');
        tx.executeSql('INSERT OR IGNORE INTO categories(rowid, name, entryState) VALUES(?, ?, ?)', [0, qsTr("Default"), 0]);
    });
}

function simpleQuery(query, values/*, getSelectedCount*/) {
    var db = getDatabase();
    var res = undefined;
    values = defaultFor(values, []);

    if (!query) {
        console.log("error: empty query");
        return undefined;
    }

    try {
        db.transaction(function(tx) { res = tx.executeSql(query, values); });
    } catch(e) {
        console.log("error in query: '"+ e +"', values=", values);
        res = undefined;
    }

    return res;
}

function getCategories() {
    var q = simpleQuery('SELECT rowid, * FROM categories;', []);
    var res = []

    for (var i = 0; i < q.rows.length; i++) {
        var item = q.rows.item(i);

        res.push({entryId: item.rowid,
                     name: item.name,
                     entryState: parseInt(item.entryState, 10),
                 });
    }

    return res;
}

function getCategory(entryId) {
    entryId = defaultFor(entryId, 0);
    var q = simpleQuery('SELECT rowid, * FROM categories WHERE rowid=? LIMIT 1;', [entryId]);
    if (q.rows.length > 0) {
        var item = q.rows.item(0);
        return { entryId: item.rowid, name: item.name, entryState: parseInt(item.entryState, 10) };
    } else {
        return undefined;
    }
}

function addCategory(name, entryState) {
    if (!name) return undefined;
    simpleQuery('INSERT INTO categories VALUES (?, ?)', [name, Number(entryState)])
    var q = simpleQuery('SELECT rowid FROM categories ORDER BY rowid DESC LIMIT 1;', []);
    if (q.rows.length > 0) return q.rows.item(0).rowid;
    else return undefined;
}

function updateCategory(entryId, name, entryState) {
    if (entryId === undefined) {
        console.warn("failed to update category: invalid entry id", name, entryState);
        return;
    }

    simpleQuery('UPDATE categories SET name=?, entryState=? WHERE rowid=?',
                [name, Number(entryState), entryId])
}

function deleteCategory(entryId) {
    if (entryId === undefined) {
        console.warn("failed to delete category: invalid entry id");
        return;
    }

    simpleQuery('DELETE FROM categories WHERE rowid=?', [entryId]);
}

function getEntries(forCategory) {
    forCategory = defaultFor(forCategory, 0);
    var q = simpleQuery('SELECT rowid, * FROM entries WHERE category=?;', [forCategory]);
    var res = []

    for (var i = 0; i < q.rows.length; i++) {
        var item = q.rows.item(i);

        res.push({entryId: item.rowid,
                     date: new Date(item.date),
                     entryState: parseInt(item.entryState, 10),
                     subState: parseInt(item.subState, 10),
                     createdOn: new Date(item.createdOn),
                     weight: parseInt(item.weight, 10),
                     interval: parseInt(item.interval, 10),
                     category: item.category,
                     text: item.text,
                     description: item.description
                 });
    }

    return res;
}

function addEntry(date, entryState, subState, createdOn, weight, interval, category, text, description) {
    simpleQuery('INSERT INTO entries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        date.toLocaleString(Qt.locale(), "yyyy-MM-dd"),
        Number(entryState), Number(subState),
        createdOn.toLocaleString(Qt.locale(), "yyyy-MM-dd"),
        weight, interval, category, text, description
    ])

    var q = simpleQuery('SELECT rowid FROM entries ORDER BY rowid DESC LIMIT 1;', []);
    if (q.rows.length > 0) return q.rows.item(0).rowid;
    else return undefined;
}

function updateEntry(entryId, date, entryState, subState, createdOn, weight, interval, category, text, description) {
    if (entryId === undefined) {
        console.warn("failed to update: invalid entry id", date, text);
        return;
    }

    simpleQuery('UPDATE entries SET\
        date=?, entryState=?, subState=?,
        createdOn=?, weight=?, interval=?,
        category=?, text=?, description=? WHERE rowid=?', [
        date.toLocaleString(Qt.locale(), "yyyy-MM-dd"),
        Number(entryState), Number(subState),
        createdOn.toLocaleString(Qt.locale(), "yyyy-MM-dd"),
        weight, interval, category, text, description,
        entryId
    ])
}

function deleteEntry(entryId) {
    if (entryId === undefined) {
        console.warn("failed to delete: invalid entry id");
        return;
    }

    simpleQuery('DELETE FROM entries WHERE rowid=?', [entryId]);
}

function carryOverFrom(fromDate) {
    fromDate = defaultFor(fromDate, new Date(NaN));

    // copy all entry with entryState = todo and subState = today, that are older than today
    // (and, if we have fromDate, younger than fromDate), and set the new date to today's date
    var query = 'INSERT INTO entries(date, entryState, subState, createdOn, weight, interval, category, text, description)\
        SELECT date("now"), entryState, subState, createdOn, weight, interval, category, text, description FROM entries\
            WHERE (date < date("now")) AND (entryState = ?) AND (subState = ?) %1 ORDER BY rowid ASC'
    var mainValues = [EntryState.todo, EntrySubState.today];

    var updateQuery = 'UPDATE entries SET subState=? WHERE (date < date("now")) AND (entryState = ?) AND (subState = ?) %1'
    var updateValues = [EntrySubState.tomorrow, EntryState.todo, EntrySubState.today];

    if (isNaN(fromDate.valueOf())) {
        query = query.arg("");
        updateQuery = updateQuery.arg("");
    } else {
        var fromDateString = fromDate.toLocaleString(Qt.locale(), "yyyy-MM-dd");
        var extraClause = "AND (date > date(?))";
        query = query.arg(extraClause);
        updateQuery = updateQuery.arg(extraClause);
        mainValues.push(fromDateString);
        updateValues.push(fromDateString);
    }

    var result = simpleQuery(query, mainValues);
    simpleQuery(updateQuery, updateValues);

    if (result === undefined) {
        console.log("failed to carry over any entries");
        return false;
    } else {
        console.log("entries carried over:", result.rowsAffected);
        return true;
    }
}