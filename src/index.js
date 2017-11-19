import {el} from "./element";
import {_} from "./util";

const REPLACE = 0;
const REORDER = 1;
const ATTR = 2;//暂不考虑
const TEXT = 3;

function sameNode(vnode1, vnode2) {
    return (
        vnode1 && vnode2 && vnode1.tagName === vnode2.tagName&&vnode1.key === vnode2.key
    )
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (sameNode(a[i], obj)) {
            return a[i];
        }
    }
    return false;
}

/**
 * 新旧树节点比较
 * @param oldVnode
 * @param newVnode
 */
function differ(oldTree, newTree) {
    let index = 0;
    let patches = {};
    walk(oldTree, newTree, index, patches)
    return patches;
}
var key_id = 0;
function walk(oldNode, newNode, index, patches) {
    let currentPatch = [];
    // 如果oldNode被remove掉了，即 newNode === null的时候
    if (newNode === null || newNode === undefined) {
        // 先不做操作, 具体交给 list diff 处理
    }
    else if (_.isString(oldNode) && _.isString(newNode)) {
        if (newNode !== oldNode) currentPatch.push({type: TEXT, content: newNode})
    }
    else if (sameNode(oldNode, newNode)) {
        //比较属性值得，暂不实现
        //TODO
        let diffs = differChildren(oldNode.children, newNode.children);
        let newChildren = diffs.children;
        if (diffs.moves.length) {
            let reorderPatch = {type: REORDER, moves: diffs.moves}
            currentPatch.push(reorderPatch)
        }
        key_id = index;
        oldNode.children.forEach((child, i) => {
            let newChild = newChildren[i];
            key_id++;
            // 递归继续比较
            walk(child, newChild, key_id, patches)
        })
    }
    else {
        currentPatch.push({type: REPLACE, node: newNode})
    }
    if (currentPatch.length) {
        patches[index] = currentPatch
    }
}


function differChildren(oldChildren, newChildren) {
    var newAdd = [], simulateArray = [], moves = [], children = [];
    var oldCopy = oldChildren.slice(0);
    console.log(newChildren)
    for (var i = 0; i < oldCopy.length; i++) {
        var newNode = contains(newChildren, oldCopy[i]);
        if (!newNode) {
            oldCopy.splice(i, 1);
            children.push(null);
            remove(i);
        }
        else {
            children.push(newNode);
        }
    }
    var newAddIndex = 0;
    for (var i = 0; i < newChildren.length; i++) {
        if (!contains(oldCopy, newChildren[i])) {
            newAdd.push(newChildren[i]);
            insert(oldCopy.length + newAddIndex, newChildren[i]);
            newAddIndex++;
        }
    }
    simulateArray = oldCopy.concat(newAdd);

    var i = 0, j = 0;//i:simulate indx j:new array index
    while (j < newChildren.length) {
        var newItem = newChildren[j];
        if (sameNode(simulateArray[i], newChildren[j])) {
            i++;
            j++;
            continue;
        }
        if (simulateArray[i]) {
            if (sameNode(simulateArray[i + 1], newItem)) {
                simulateArray.splice(i, 1);
                remove(i);
                i++;
                j++;
            }
            else {
                simulateArray.splice(i, 0, newItem);
                insert(i, newItem);
                i++;
                j++;
            }
        }
        else {
            simulateArray.push(newItem);
            insert(i, newItem);
            i++;
            j++;
        }
    }

    // 记录remove操作
    function remove(index) {
        let move = {index: index, type: 0}
        moves.push(move)
    }

    // 记录insert操作
    function insert(index, item) {
        let move = {index: index, item: item, type: 1};
        moves.push(move)
    }

    /**
     * 移除多余的dom元素
     */
    while (simulateArray.length > newChildren.length) {
        simulateArray.splice(simulateArray.length - 1, 1);
        remove(simulateArray.length - 1);
    }

    return {
        moves: moves,
        children: children
    }
}

var dom = el("div", {key:1}, [
    el("ul", {id: "u1"}, [
        el("li", {key:1}, ["111"]),
        el("li", {key:2}, ["222"])
    ]),
    el("p", {id: "p1"}, [
        "aaa"
    ]),
]);
var dom1 = el("div", {key:1}, [
    el("ul", {id: "u1"}, [
        el("li", {key:2}, ["21www22"]),
        el("li", {key:1}, ["111"])
    ]),
    el("p", {id: "p1"}, [
        "aaaq"
    ])
]);
console.log(differ(dom, dom1));