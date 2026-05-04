/*
	pageData is an object that defines various page types and their associated rendering details.
	
	Each page type includes the following properties:
	
	- titles: An array of possible titles for the page, which are used to identify the page type.
	- types: An array of page types that can be matched; the type takes precedence over the title for identification.
	- partial: The path to the partial template that will be used to render the content of the page.
	- layout: Specifies the layout style for the page. "raw" indicates that no theme layout will be applied, while "default" means the standard theme layout (container) will be used.
*/

const pageData = {
	home: {
		titles: ["home", "首页"],
		types: ["home"],
		partial: "pages/home/home-content",
		layout: "raw",
	},
	archive: {
		titles: ["archive", "归档"],
		types: ["archive", "archives"],
		partial: "pages/archive/archive",
		layout: "raw",
	},
	post: {
		titles: ["post"],
		types: ["post"],
		partial: "pages/post/article-content",
		layout: "raw",
	},
	allPosts: {
		titles: ["posts", "文章"],
		types: ["posts"],
		partial: "pages/allposts/allposts",
		layout: "raw",
	},
	categories: {
		titles: ["category", "categories"],
		types: ["category", "categories"],
		partial: "pages/category/categories",
		layout: "default",
	},
	categoryDetail: {
		titles: [],
		types: [],
		partial: "pages/category/category-detail",
		layout: "default",
	},
	tags: {
		titles: ["tag", "tags"],
		types: ["tag", "tags"],
		partial: "pages/tag/tags",
		layout: "default",
	},
	tagDetail: {
		titles: [],
		types: [],
		partial: "pages/tag/tag-detail",
		layout: "default",
	},
	aboutPage: {
		titles: ["about", "关于"],
		types: ["about"],
		partial: "pages/about/about",
		layout: "default",
	},
	pageTemplate: {
		titles: [],
		types: [],
		partial: "pages/page-template",
		layout: "default",
	},
	creditsPage: {
		titles: ["credits", "致谢"],
		types: ["credits"],
		partial: "pages/credits/credits",
		layout: "default",
	},
};

hexo.extend.helper.register("getAllPageData", function () {
	return pageData;
});

hexo.extend.helper.register("getPageData", function (page) {
	if (this.is_home()) return pageData.home;
	if (this.is_archive()) return pageData.archive;
	if (this.is_post()) return pageData.post;
	if (this.is_category()) return pageData.categoryDetail;
	if (this.is_tag()) return pageData.tagDetail;

	const currentPageConfig = Object.entries(pageData).find(([type, config]) => {
		return config.types.includes(page.template || page.type) || config.titles.includes(page.title?.toLowerCase());
	});
	return currentPageConfig ? pageData[currentPageConfig[0]] : null;
});

hexo.extend.helper.register("getPagePartialPath", function (page) {
	const matchesPageType = (type) => {
		const config = pageData[type];
		return (
			config.types.includes(page.template || page.type) ||
			config.titles.includes(page.title?.toLowerCase())
		);
	};

	// Check built-in page types first
	if (this.is_home()) return pageData.home.partial;

	if (this.is_post()) return pageData.post.partial;
	// Check custom page types
	for (const [type, config] of Object.entries(pageData)) {
		if (matchesPageType(type) && config.layout === "raw") {
			return config.partial;
		} else if (this.is_archive() && pageData.archive.layout === "raw") { // return raw layout for archive page
			return pageData.archive.partial;
		} else if (this.is_category() && pageData.categoryDetail.layout === "raw") { // return raw layout for category page
			return pageData.categoryDetail.partial;
		} else if (this.is_tag() && pageData.tagDetail.layout === "raw") { // return raw layout for tag page
			return pageData.tagDetail.partial;
		}
	}

	// Fall back to page template
	return pageData.pageTemplate.partial;
});
