import moment from "moment";
import {
    store,
    IssueIds,
    IssueCommentIds,
    PullRequestIds,
    PullRequestCommentIds,
    Status,
    IsNotTicket,
    NotYetViewed,
    isIssueCommentIds,
    isPullRequestCommentIds
} from "./database";

/**
 * VersionControl (git) Service
 * This example shows some more advanced modeling
 *
**/

// Get Public Repositories By Username
export async function getPublicRepository(username: string) {
    return store.entities.repositories.query.created({username, isPrivate: false});
}

// Get PullRequest and Associated Comments -- newest comments first
export async function reviewPullRequest(pr: PullRequestIds) {
    // let a = await store.collections.PRReview(pr)
    //     .page()
    //     .then(([page, results]) => {
    //        return page?.ticketType
    //     });
    //     // .go({params: {ScanIndexForward: false}});
    let b = await store.collections
        .inbox({replyTo: "user"})
        // .go()
        // .then((results) => {
        //     results.issueComments.map(items => {
        //         items.
        //     })
        // })

        .page({replyTo: "abc"})
        .then(([page, results]) => {
            page?.pullRequestNumber
        });

}

// Get Issue and Associated Comments -- newest comments first
export async function reviewIssue(issue: IssueIds) {
    return store.collections.issueReview(issue).go({params: {ScanIndexForward: false}});
}

// Get PullRequests Created By User
export async function getUserPullRequests(username: string, status?: Status) {
    return store.entities.pullRequests
        .query.created({username, status})
        .go({params: {ScanIndexForward: false}});
}

// Close pull request -- guards: can only be performed by user who opened PR or the repo owner
export async function closePullRequest(user: string, pr: PullRequestIds) {
    return store.entities.pullRequests
        .update(pr)
        .set({status: "Closed"})
        .where(({username, repoOwner}, {eq}) => `
            ${eq(username, user)} OR ${eq(repoOwner, user)}
        `)
        .go()
}

// Get Subscriptions for a given Repository, PullRequest, or Issue.
export async function getSubscribed(repoOwner: string, repoName: string, ticketNumber: string = IsNotTicket) {
    return store.collections.subscribers({repoOwner, repoName, ticketNumber}).go();
}

const MinDate = "0000-00-00";
const MaxDate = "9999-99-99";

// Get unread comment replies
export async function getUnreadComments(user: string) {
    let [issues, pullRequests] = await Promise.all([
        store.entities
            .issueComments.query
            .replies({replyTo: user})
            .between(
                {
                    createdAt: MinDate,
                    replyViewed: NotYetViewed
                },
                {
                    createdAt: MaxDate,
                    replyViewed: NotYetViewed
                }
            )
            .go(),

        store.entities
            .pullRequestComments.query
            .replies({replyTo: user})
            .between(
                {
                    createdAt: MinDate,
                    replyViewed: NotYetViewed
                },
                {
                    createdAt: MaxDate,
                    replyViewed: NotYetViewed
                }
            )
            .go()
    ]);

    return {
        issues,
        pullRequests
    };
}

// Mark comment reply as read -- guards: can only be done by the user who was being replied to
async function readReply(user: string, comment: IssueCommentIds): Promise<boolean>;
async function readReply(user: string, comment: PullRequestCommentIds): Promise<boolean>;
async function readReply(user: string, comment: any): Promise<boolean> {
    const replyViewed = moment.utc().format();
    if (isIssueCommentIds(comment)) {
        return await store.entities.issueComments
            .patch(comment)
            .set({replyViewed})
            .where(({replyTo}, {eq}) => eq(replyTo, user))
            .go()
            .then(() => true)
            .catch(() => false);
    } else if (isPullRequestCommentIds(comment)) {
        return await store.entities.pullRequestComments
            .patch(comment)
            .set({replyViewed})
            .where(({replyTo}, {eq}) => eq(replyTo, user))
            .go()
            .then(() => true)
            .catch(() => false);
    } else {
        return false;
    }
}

store.collections.