import { ArrayUtil, TreeCache } from "@rwsbillyang/usecache";


export function testTreeSearch() {
    const array = [
        { id: "1", children: [{ id: "1.1" }, { id: "1.2", children: [{ id: "hit2" }] }, { id: "1.3" }] },
        { id: "2", children: [{ id: "2.1" }, { id: "2.2" }, { id: "2.3", children: [{ id: "hit2" }] }] },
        { id: "3", children: [{ id: "3.1" }, { id: "3.2" }, { id: "3.3" }] },
        { id: "hit2" },
        { id: "5", children: [{ id: "5.1" }, { id: "5.2" }, { id: "5.3", children: [{ id: "5.3.1" }, { id: "5.3.2", children: [{ id: "5.3.2.1" }, { id: "hit2" }] }] }] },
    ]

    const path = ArrayUtil.findOneFromTree(array, "hit2", "children", "id", true)
    console.log("path=", path)

    const allPaths: any[][] = []
    ArrayUtil.findAllFromTree(allPaths, array, "hit2", "children", "id")
    console.log("allPaths:", allPaths)


    const path2 = ArrayUtil.getArrayByPathInTree(array, ["2", "2.3", "hit2"], "id")
    console.log("path2=", path2)


    const elemPath = TreeCache.getElementsByPathIdsInTreeFromCache("rule", [1, 4], "id")
    console.log("elemPath=", elemPath)

    // const elemPath2 = getElementsByPathIdsInTree(tree, [1, 4], "id")
    // console.log("elemPath2=", elemPath2)
}

