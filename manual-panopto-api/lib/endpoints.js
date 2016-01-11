module.exports = [
	{
		name:"SessionManagement",
		id:"ISessionManagement",
		functions:[
			{
				name:"GetFoldersById"
			},
			{
				name:"GetSessionsById"
			},
			{
				name:"GetFoldersList"
			},
			{
				name:"GetSessionsList"
			},
			{
				name:"UploadTranscript"
			}
		]
	},
	{
		name:"AccessManagement",
		id:"IAccessManagement",
		functions:[
			{
				name:"GetSelfUserAccessDetails"
			},
			{
				name:"GrantUsersAccessToFolder"
			},
			{
				name:"GetUserAccessDetails"
			},
			{
				name:"RevokeUsersAccessToFolder"
			}
		]
	},
	{
		name:"UserManagement",
		id:"IUserManagement",
		functions:[
			{
				name:"GetUserByKey"
			},
			{
				name:"GetUsers"
			}
		]
	}
];