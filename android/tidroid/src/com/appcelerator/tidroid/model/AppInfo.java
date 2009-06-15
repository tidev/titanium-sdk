package com.appcelerator.tidroid.model;

import java.util.List;

public class AppInfo
{
	private int id;
	private String publishedDate;
	private String appPage;
	private String title;
	private String guid;
	private String description;
	private String url;
	private String author;
	private int version;
	private int downloads;
	private int rating;
	private int votes;
	private String image;
	private boolean hasVoted;

	public class ReleaseInfo {
		private String platform;
		private String platformLabel;
		private String url;
		private int downloads;
		public ReleaseInfo () {

		}

		public String getPlatform() {
			return platform;
		}
		public void setPlatform(String platform) {
			this.platform = platform;
		}
		public String getPlatformLabel() {
			return platformLabel;
		}
		public void setPlatformLabel(String platformLabel) {
			this.platformLabel = platformLabel;
		}
		public String getUrl() {
			return url;
		}
		public void setUrl(String url) {
			this.url = url;
		}
		public int getDownloads() {
			return downloads;
		}
		public void setDownloads(int downloads) {
			this.downloads = downloads;
		}
	}

	private List<ReleaseInfo> releases;

	public AppInfo() {

	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getPublishedDate() {
		return publishedDate;
	}

	public void setPublishedDate(String publishedDate) {
		this.publishedDate = publishedDate;
	}

	public String getAppPage() {
		return appPage;
	}

	public void setAppPage(String appPage) {
		this.appPage = appPage;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getGuid() {
		return guid;
	}

	public void setGuid(String guid) {
		this.guid = guid;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getAuthor() {
		return author;
	}

	public void setAuthor(String author) {
		this.author = author;
	}

	public int getVersion() {
		return version;
	}

	public void setVersion(int version) {
		this.version = version;
	}

	public int getDownloads() {
		return downloads;
	}

	public void setDownloads(int downloads) {
		this.downloads = downloads;
	}

	public int getRating() {
		return rating;
	}

	public void setRating(int rating) {
		this.rating = rating;
	}

	public int getVotes() {
		return votes;
	}

	public void setVotes(int votes) {
		this.votes = votes;
	}

	public String getImage() {
		return image;
	}

	public void setImage(String image) {
		this.image = image;
	}

	public boolean isHasVoted() {
		return hasVoted;
	}

	public void setHasVoted(boolean hasVoted) {
		this.hasVoted = hasVoted;
	}

	public List<ReleaseInfo> getReleases() {
		return releases;
	}

	public void setReleases(List<ReleaseInfo> releases) {
		this.releases = releases;
	}

}
