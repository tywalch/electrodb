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
    PullRequest,
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
    return store.collections.PRReview(pr)
        .page(null, {params: {ScanIndexForward: false}})
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
    const start = {
        createdAt: MinDate,
        replyViewed: NotYetViewed
    };
    const end = {
        createdAt: MaxDate,
        replyViewed: NotYetViewed
    };
    let [issues, pullRequests] = await Promise.all([
        store.entities
            .issueComments.query
            .replies({replyTo: user})
            .between(start, end)
            .go(),

        store.entities
            .pullRequestComments.query
            .replies({replyTo: user})
            .between(start, end)
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

async function approvePullRequest(repoOwner: string, repoName: string, pullRequestNumber: string, username: string) {
    const pullRequest = await store.entities.pullRequests
        .get({repoOwner, repoName, pullRequestNumber})
        .go();

    if (!pullRequest || !pullRequest.reviewers) {
        return false;
    }

    let index: number = -1;

    for (let i = 0; i < pullRequest.reviewers.length; i++) {
        const reviewer = pullRequest.reviewers[i];
        if (reviewer.username === username) {
            index = i;
        }
    }

    if (index === -1) {
        return false;
    }

    return store.entities.pullRequests
        .update({repoOwner, repoName, pullRequestNumber})
        .data(({reviewers}, {set}) => {
            set(reviewers[index].approved, true);
        })
        .where(({reviewers}, {eq}) => `
            ${eq(reviewers[index].username, username)};
        `)
        .go()
        .then(() => true)
        .catch(() => false);
}

async function followRepository(repoOwner: string, repoName: string, follower: string) {
    await store.entities
        .repositories.update({repoOwner, repoName})
        .add({follower: [follower]})
        .go()
}