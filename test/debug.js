"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
var __1 = require("..");
var dynamodb_1 = require("aws-sdk/clients/dynamodb");
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var client = new dynamodb_1.DocumentClient({
    region: "us-east-1",
    endpoint: 'http://localhost:8000',
});
var table = "electro";
var entity = new __1.Entity({
    model: {
        entity: "sortKeys",
        version: "1",
        service: "sortKeys"
    },
    attributes: {
        prop1: {
            type: "string",
        },
        prop2: {
            type: "string",
        },
        prop3: {
            type: "string",
        },
    },
    indexes: {
        records: {
            pk: {
                field: "pk",
                composite: []
            },
            sk: {
                field: "sk",
                composite: ["prop1", "prop2", "prop3"],
            }
        }
    }
}, { table: table, client: client });
function getEveryCharacterConcatinationCombination(chars) {
    if (!chars || chars.length === 0)
        return [];
    var result = [];
    // Create a function to form combinations of a specific length
    function combine(prefix, index, length) {
        if (length === 0) {
            result.push(prefix);
            return;
        }
        for (var i = index; i < chars.length; i++) {
            combine(prefix + chars[i], i, length - 1);
        }
    }
    // Generate all combinations for lengths from 1 to chars.length
    for (var len = 1; len <= chars.length; len++) {
        combine('', 0, len);
    }
    return result;
}
// const allValues = getEveryCharacterConcatinationCombination(characters);
function generateAllPossibleItems(properties, allValues) {
    var result = [];
    // A recursive function to form all possible Item combinations
    function generateItem(currentItem, propertyIndex) {
        var _a;
        if (propertyIndex === properties.length) {
            result.push(currentItem);
            return;
        }
        for (var _i = 0, allValues_1 = allValues; _i < allValues_1.length; _i++) {
            var value = allValues_1[_i];
            var nextItem = __assign(__assign({}, currentItem), (_a = {}, _a[properties[propertyIndex]] = value, _a));
            generateItem(nextItem, propertyIndex + 1);
        }
    }
    generateItem({}, 0);
    return result;
}
function getAllPossiblePartialItems(item) {
    var _a;
    var _b;
    var partialSortKeys = [];
    for (var i = 0; i < entity.schema.indexes.records.sk.composite.length; i++) {
        var previousPartialSortKeys = (_b = partialSortKeys[partialSortKeys.length - 1]) !== null && _b !== void 0 ? _b : {};
        var field = entity.schema.indexes.records.sk.composite[i];
        var value = item[field];
        if (value !== undefined) {
            partialSortKeys.push(__assign(__assign({}, previousPartialSortKeys), (_a = {}, _a[field] = value, _a)));
        }
    }
    return partialSortKeys;
}
function loadAllPossibleValues(items) {
    return __awaiter(this, void 0, void 0, function () {
        var alreadyLoaded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, entity.get(items[0]).go()];
                case 1:
                    alreadyLoaded = _a.sent();
                    if (alreadyLoaded.data !== null)
                        return [2 /*return*/];
                    return [4 /*yield*/, entity.put(items).go()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, sleep(5000)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function expectItemsEqual(a, b) {
    var i = 0;
    try {
        (0, chai_1.expect)(a.length).to.equal(b.length);
        for (i = 0; i < a.length; i++) {
            var itemA = a[i];
            var itemB = b[i];
            (0, chai_1.expect)(itemA).to.deep.equal(itemB);
        }
    }
    catch (err) {
        console.log('%o', { failedAt: i, a: a[i], b: b[i] });
        throw err;
    }
}
var properties = ['prop1', 'prop2', 'prop3'];
var characters = ['a', 'b', 'c'];
var allValues = getEveryCharacterConcatinationCombination(characters);
var allItems = generateAllPossibleItems(properties, allValues);
var allValuesOrdered = [];
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var all, _i, _a, item;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, loadAllPossibleValues(allItems)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, entity.query.records({}).go({ pages: 'all' })];
                case 2:
                    all = _b.sent();
                    for (_i = 0, _a = all.data; _i < _a.length; _i++) {
                        item = _a[_i];
                        allValuesOrdered.push(item);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
;
function test(start, end, onFailure) {
    return __awaiter(this, void 0, void 0, function () {
        var firsts, lasts, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firsts = getAllPossiblePartialItems(allValuesOrdered[start]);
                    lasts = getAllPossiblePartialItems(allValuesOrdered[end]);
                    _loop_1 = function (i) {
                        var first, firstKeys, getGte, gteParams, getGt, gtParams, _loop_2, j;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    first = firsts[i];
                                    firstKeys = Object.keys(first);
                                    getGte = entity.query.records({}).gte(first).go({ pages: 'all' });
                                    gteParams = entity.query.records({}).gte(first).params();
                                    getGt = entity.query.records({}).gt(first).go({ pages: 'all' });
                                    gtParams = entity.query.records({}).gt(first).params();
                                    _loop_2 = function (j) {
                                        var last, lastKeys, getLte, lteParams, getLt, ltParams, getBetween, betweenParams, _c, gte, gt, lte, lt, between, gteIndex, gtIndex, lteIndex, ltIndex, _loop_3, k, expectedGte, expectedGt, expectedLte, expectedLt, expectedBetween;
                                        return __generator(this, function (_d) {
                                            switch (_d.label) {
                                                case 0:
                                                    last = lasts[j];
                                                    lastKeys = Object.keys(last);
                                                    getLte = entity.query.records({}).lte(last).go({ pages: 'all' });
                                                    lteParams = entity.query.records({}).lte(last).params();
                                                    getLt = entity.query.records({}).lt(last).go({ pages: 'all' });
                                                    ltParams = entity.query.records({}).lt(last).params();
                                                    getBetween = entity.query.records({}).between(first, last).go({ pages: 'all' });
                                                    betweenParams = entity.query.records({}).between(first, last).params();
                                                    return [4 /*yield*/, Promise.all([getGte, getGt, getLte, getLt, getBetween])];
                                                case 1:
                                                    _c = _d.sent(), gte = _c[0], gt = _c[1], lte = _c[2], lt = _c[3], between = _c[4];
                                                    gteIndex = void 0;
                                                    gtIndex = void 0;
                                                    lteIndex = void 0;
                                                    ltIndex = void 0;
                                                    _loop_3 = function (k) {
                                                        var record = allValuesOrdered[k];
                                                        var matchesAllStart = firstKeys.every(function (key) { return first[key] === record[key]; });
                                                        var matchesAllEnd = lastKeys.every(function (key) { return last[key] === record[key]; });
                                                        if (gteIndex === undefined && matchesAllStart) {
                                                            gteIndex = k;
                                                        }
                                                        if (gteIndex !== undefined && gtIndex === undefined && !matchesAllStart) {
                                                            gtIndex = k;
                                                        }
                                                        if (matchesAllEnd) {
                                                            lteIndex = k + 1;
                                                        }
                                                        if (lteIndex === undefined && !matchesAllEnd) {
                                                            ltIndex = k + 1;
                                                        }
                                                    };
                                                    for (k = 0; k < allValuesOrdered.length; k++) {
                                                        _loop_3(k);
                                                    }
                                                    expectedGte = allValuesOrdered.slice(gteIndex !== null && gteIndex !== void 0 ? gteIndex : 0, allValuesOrdered.length);
                                                    expectedGt = allValuesOrdered.slice(gtIndex !== null && gtIndex !== void 0 ? gtIndex : 0, allValuesOrdered.length);
                                                    expectedLte = allValuesOrdered.slice(0, lteIndex);
                                                    expectedLt = allValuesOrdered.slice(0, ltIndex);
                                                    expectedBetween = allValuesOrdered.slice(gteIndex !== null && gteIndex !== void 0 ? gteIndex : 0, lteIndex);
                                                    try {
                                                        expectItemsEqual(gte.data, expectedGte);
                                                    }
                                                    catch (err) {
                                                        onFailure({
                                                            received: {
                                                                first: gte.data[0],
                                                                last: gte.data[gte.data.length - 1],
                                                                count: gte.data.length,
                                                            },
                                                            expected: {
                                                                first: expectedGte[0],
                                                                last: expectedGte[expectedGte.length - 1],
                                                                count: expectedGte.length,
                                                            },
                                                            params: gteParams,
                                                            type: 'gte',
                                                            filterStart: {
                                                                type: 'gte',
                                                                index: i,
                                                                properties: first,
                                                            },
                                                        });
                                                    }
                                                    try {
                                                        expectItemsEqual(lte.data, expectedLte);
                                                    }
                                                    catch (err) {
                                                        onFailure({
                                                            received: {
                                                                first: lte.data[0],
                                                                last: lte.data[lte.data.length - 1],
                                                                count: lte.data.length,
                                                            },
                                                            expected: {
                                                                first: expectedLte[0],
                                                                last: expectedLte[expectedLte.length - 1],
                                                                count: expectedLte.length,
                                                            },
                                                            params: lteParams,
                                                            type: 'lte',
                                                            filterEnd: {
                                                                type: 'lte',
                                                                index: j,
                                                                properties: last,
                                                            },
                                                        });
                                                    }
                                                    try {
                                                        expectItemsEqual(lt.data, expectedLt);
                                                    }
                                                    catch (err) {
                                                        onFailure({
                                                            received: {
                                                                first: lt.data[0],
                                                                last: lt.data[lt.data.length - 1],
                                                                count: lt.data.length,
                                                            },
                                                            expected: {
                                                                first: expectedLt[0],
                                                                last: expectedLt[expectedLt.length - 1],
                                                                count: expectedLt.length,
                                                            },
                                                            params: ltParams,
                                                            type: 'lt',
                                                            filterEnd: {
                                                                type: 'lt',
                                                                index: j,
                                                                properties: last,
                                                            },
                                                        });
                                                    }
                                                    try {
                                                        expectItemsEqual(between.data, expectedBetween);
                                                    }
                                                    catch (err) {
                                                        onFailure({
                                                            received: {
                                                                first: between.data[0],
                                                                last: between.data[between.data.length - 1],
                                                                count: between.data.length,
                                                            },
                                                            expected: {
                                                                first: expectedBetween[0],
                                                                last: expectedBetween[expectedBetween.length - 1],
                                                                count: expectedBetween.length,
                                                            },
                                                            params: betweenParams,
                                                            type: 'between',
                                                            filterStart: {
                                                                type: 'between',
                                                                index: i,
                                                                properties: first,
                                                            },
                                                            filterEnd: {
                                                                type: 'between',
                                                                index: j,
                                                                properties: last,
                                                            },
                                                        });
                                                    }
                                                    try {
                                                        expectItemsEqual(gt.data, expectedGt);
                                                    }
                                                    catch (err) {
                                                        onFailure({
                                                            received: {
                                                                first: gt.data[0],
                                                                last: gt.data[gt.data.length - 1],
                                                                count: gt.data.length,
                                                            },
                                                            expected: {
                                                                first: expectedGt[0],
                                                                last: expectedGt[expectedGt.length - 1],
                                                                count: expectedGt.length,
                                                            },
                                                            params: gtParams,
                                                            type: 'gt',
                                                            filterStart: {
                                                                type: 'gt',
                                                                index: i,
                                                                properties: first,
                                                            },
                                                        });
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    j = 0;
                                    _b.label = 1;
                                case 1:
                                    if (!(j < lasts.length)) return [3 /*break*/, 4];
                                    return [5 /*yield**/, _loop_2(j)];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3:
                                    j++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < firsts.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function printFailure(failure) {
    console.log('%o', failure);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var start, end, tests, batchedTests, batchSize, i, beginning, i, batch, remainingTests, _a, lastStart, lastEnd, completed, speed, remaining, estTimeRemaining, percentComplete, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('initializing...');
                    return [4 /*yield*/, init()];
                case 1:
                    _b.sent();
                    console.log('initialization complete.');
                    (0, chai_1.expect)(allValuesOrdered.length).to.equal(allItems.length);
                    start = 0;
                    end = allValuesOrdered.length - 1;
                    tests = [];
                    while (start < end) {
                        tests.push([start, end]);
                        start++;
                        end--;
                    }
                    batchedTests = [];
                    batchSize = 5;
                    for (i = 0; i < tests.length; i += batchSize) {
                        batchedTests.push(tests.slice(i, i + batchSize));
                    }
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, , 8]);
                    beginning = Date.now();
                    i = 0;
                    _b.label = 3;
                case 3:
                    if (!(i < batchedTests.length)) return [3 /*break*/, 6];
                    batch = batchedTests[i];
                    return [4 /*yield*/, Promise.all(batch.map(function (_a) {
                            var start = _a[0], end = _a[1];
                            return test(start, end, printFailure);
                        }))];
                case 4:
                    _b.sent();
                    remainingTests = (batchedTests.length - i - 1) * 5;
                    _a = batch[batch.length - 1], lastStart = _a[0], lastEnd = _a[1];
                    completed = lastStart + Math.abs((remainingTests - lastEnd));
                    speed = (completed / ((Date.now() - beginning) / 1000)).toFixed(3);
                    remaining = remainingTests - completed;
                    estTimeRemaining = (remaining / parseFloat(speed)) / 60;
                    percentComplete = ((completed / allValuesOrdered.length) * 100).toFixed(2);
                    console.log("".concat(percentComplete, "% complete: start: ").concat(lastStart.toString().padStart(4, '0'), ", end: ").concat(lastEnd.toString().padStart(4, '0'), " at ").concat(speed, " batches/sec with an estimated ").concat(estTimeRemaining.toFixed(2), " minutes remaining"));
                    _b.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _b.sent();
                    console.log('Fatal Error:', err_1);
                    return [3 /*break*/, 8];
                case 8:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) { return console.error(err); });
