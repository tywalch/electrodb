/* istanbul ignore file */
// VersionControl (git) Service
// This example demonstrates more advanced modeling techniques using ElectroDB

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
    OwnedItems,
    isIssueCommentIds,
    isPullRequestCommentIds
} from "./database";


// Get Public Repositories By Username
export async function getPublicRepository(username: string) {
    return store.entities.repositories
        .query.created({username, isPrivate: false});
}

// Get PullRequest and Associated Comments -- newest comments first
export async function reviewPullRequest(options: { pr: PullRequestIds, cursor?: string }) {
    const { pr, cursor } = options;
    return store.collections.PRReview(pr)
        .go({ cursor, params: {ScanIndexForward: false} });
}

// Get Issue and Associated Comments -- newest comments first
export async function reviewIssue(options: {issue: IssueIds, cursor?: string}) {
    const { issue, cursor } = options;
    return store.collections.issueReview(issue)
        .go({cursor, params: {ScanIndexForward: false}});
}

// Get PullRequests Created By User
export async function getUserPullRequests(options: {
    username: string;
    status?: Status;
    cursor?: string;
}) {
    const { username, status, cursor } = options;
    return store.entities.pullRequests
        .query.created({username, status})
        .go({cursor, params: {ScanIndexForward: false}});
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

// Get all user info, repos, pull requests, and issues in one query
export async function getFirstPageLoad(username: string) {
    const results: OwnedItems = {
        issues: [],
        pullRequests: [],
        repositories: [],
        users: [],
    };
    
    let next = null;

    do {
        const {cursor, data} = await store.collections.owned({username}).go();
        results.issues = results.issues.concat(data.issues);
        results.pullRequests = results.pullRequests.concat(data.pullRequests);
        results.repositories = results.repositories.concat(data.repositories);
        results.users = results.users.concat(data.users);
        next = cursor;
    } while (next !== null);

    return results;
}

// Get Subscriptions for a given Repository, PullRequest, or Issue.
export async function getSubscribed(repoOwner: string, repoName: string, ticketNumber: string = IsNotTicket) {
    return store.collections
        .subscribers({repoOwner, repoName, ticketNumber})
        .go();
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
export async function readReply(user: string, comment: IssueCommentIds): Promise<boolean>;
export async function readReply(user: string, comment: PullRequestCommentIds): Promise<boolean>;
export async function readReply(user: string, comment: any): Promise<boolean> {
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

export async function approvePullRequest(repoOwner: string, repoName: string, pullRequestNumber: string, username: string) {
    const pullRequest = await store.entities.pullRequests
        .get({repoOwner, repoName, pullRequestNumber})
        .go();

    if (!pullRequest.data || !pullRequest.data.reviewers) {
        return false;
    }

    let index: number = -1;

    for (let i = 0; i < pullRequest.data.reviewers.length; i++) {
        const reviewer = pullRequest.data.reviewers[i];
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

export async function followRepository(repoOwner: string, repoName: string, follower: string) {
    await store.entities
        .repositories.update({repoOwner, repoName})
        .add({followers: [follower]})
        .go();
}

