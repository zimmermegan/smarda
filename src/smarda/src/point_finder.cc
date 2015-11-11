/*
 * point_finder.cc : C++ code to take a point cloud image and
 *                   find cylinders.
 * 
 */

#include <ros/ros.h>

#include <sensor_msgs/PointCloud2.h>

#include <boost/foreach.hpp>
#include <pcl_conversions/pcl_conversions.h>
#include <pcl/point_cloud.h>
#include <pcl/point_types.h>
#include <pcl/segmentation/sac_segmentation.h>
#include <pcl/ModelCoefficients.h>
#include <pcl/point_types.h>
#include <pcl/filters/extract_indices.h>
#include <pcl/filters/passthrough.h>
#include <pcl/features/normal_3d.h>
#include <pcl/sample_consensus/method_types.h>
#include <pcl/sample_consensus/model_types.h>
#include <pcl/segmentation/sac_segmentation.h>
#include <pcl/visualization/cloud_viewer.h>

#if 0
void cloud_cb(const ros::MessageEvent<sensor_msgs::PointCloud2 const>& event)
{
	const std::string& publisher_name = event.getPublisherName();
	const ros::M_string& header = event.getConnectionHeader();
	ros::Time receipt_time = event.getReceiptTime();

	const sensor_msgs::PointCloud2ConstPtr& msg = event.getMessage();	
#else
void cloud_cb(const sensor_msgs::PointCloud2ConstPtr &msg)
{
#endif
	ROS_INFO("Got cloud message:"); // %s\n", publisher_name.c_str());

	pcl::PointCloud<pcl::PointXYZRGB>::Ptr cloud(
				new pcl::PointCloud<pcl::PointXYZRGB>());
	pcl::fromROSMsg(*msg, *cloud);
	pcl::PassThrough<pcl::PointXYZRGB> pass;
	pcl::NormalEstimation<pcl::PointXYZRGB, pcl::Normal> ne;
	pcl::SACSegmentationFromNormals<pcl::PointXYZRGB, pcl::Normal> seg; 
	pcl::PCDWriter writer;
	pcl::ExtractIndices<pcl::PointXYZRGB> extract;
	pcl::ExtractIndices<pcl::Normal> extract_normals;
	pcl::search::KdTree<pcl::PointXYZRGB>::Ptr tree(
				new pcl::search::KdTree<pcl::PointXYZRGB> ());

	pcl::PointCloud<pcl::PointXYZRGB>::Ptr cloud_filtered(
				new pcl::PointCloud<pcl::PointXYZRGB>);
 	pcl::PointCloud<pcl::Normal>::Ptr cloud_normals(
				new pcl::PointCloud<pcl::Normal>);
 	pcl::PointCloud<pcl::PointXYZRGB>::Ptr cloud_filtered2(
				new pcl::PointCloud<pcl::PointXYZRGB>);
 	pcl::PointCloud<pcl::Normal>::Ptr cloud_normals2(
				new pcl::PointCloud<pcl::Normal>);
 	pcl::ModelCoefficients::Ptr coefficients_plane(
						new pcl::ModelCoefficients), 
				coefficients_cylinder(
						new pcl::ModelCoefficients);
	pcl::PointIndices::Ptr inliers_plane(new pcl::PointIndices), 
				inliers_cylinder(new pcl::PointIndices);

	ROS_INFO("Got cloud message\n");
	/* 
	 * We have a PCL-native PointCloud object, so run RANSAC and 
	 * cylinder segmentation (from PCL tutorials)
	 */

	/* Filter out Z ranges beyond 1.5meters */
	pass.setInputCloud (cloud);
	pass.setFilterFieldName ("z");
	pass.setFilterLimits (0, 1.5);
	pass.filter (*cloud_filtered);
	std::cerr << "PointCloud after filtering has: " << 
			cloud_filtered->points.size () << " data points." << 
								std::endl;

	/* Estimate point normals */
	ne.setSearchMethod (tree);
	ne.setInputCloud (cloud_filtered);
	ne.setKSearch (50);
	ne.compute (*cloud_normals);

	/* 
	 * Create the segmentation object for the planar model and 
	 * set all the parameters.
         */
	seg.setOptimizeCoefficients (true);
	seg.setModelType (pcl::SACMODEL_NORMAL_PLANE);
	seg.setNormalDistanceWeight (0.1);
	seg.setMethodType (pcl::SAC_RANSAC);
	seg.setMaxIterations (100);
	seg.setDistanceThreshold (0.03);
	seg.setInputCloud (cloud_filtered);
	seg.setInputNormals (cloud_normals);

	/* Obtain the plane inliers and coefficients */
	seg.segment (*inliers_plane, *coefficients_plane);
	std::cerr << "Plane coefficients: " << *coefficients_plane << std::endl;

	/* Extract the planar inliers from the input cloud */
	extract.setInputCloud (cloud_filtered);
	extract.setIndices (inliers_plane);
 	extract.setNegative (false);

	/* Remove the planar inliers, extract the rest */
	extract.setNegative (true);
	extract.filter (*cloud_filtered2);
	extract_normals.setNegative (true);
	extract_normals.setInputCloud (cloud_normals);
	extract_normals.setIndices (inliers_plane);
	extract_normals.filter (*cloud_normals2);

 	/* 
	 * Create the segmentation object for cylinder segmentation 
	 * and set all the parameters
         */
	seg.setOptimizeCoefficients (true);
	seg.setModelType (pcl::SACMODEL_CYLINDER);
	seg.setMethodType (pcl::SAC_RANSAC);
	seg.setNormalDistanceWeight (0.1);
	seg.setMaxIterations (10000);
	seg.setDistanceThreshold (0.05);
	seg.setRadiusLimits (0, 0.1);
	seg.setInputCloud (cloud_filtered2);
	seg.setInputNormals (cloud_normals2);

	/* Obtain the cylinder inliers and coefficients */
	seg.segment (*inliers_cylinder, *coefficients_cylinder);
	std::cerr << "Cylinder coefficients: " << *coefficients_cylinder << 
								std::endl;

	/* Extract cylinder inlierers. */
	extract.setInputCloud (cloud_filtered2);
	extract.setIndices (inliers_cylinder);
	extract.setNegative (false);

	pcl::PointCloud<pcl::PointXYZRGB>::Ptr cloud_cylinder (
				new pcl::PointCloud<pcl::PointXYZRGB> ());
	extract.filter (*cloud_cylinder);

	ROS_INFO("Found %zd points on a cylinder\n", 
					cloud_cylinder->points.size());

	int maxr = 0, maxg = 0, maxb = 0;
	int avgr = 0, avgg = 0, avgb = 0;
	float maxx = 0, maxy = 0, maxz = 0;
	float avgx = 0, avgy = 0, avgz = 0;
	BOOST_FOREACH(pcl::PointXYZRGB pt, cloud_cylinder->points) {
		std::cerr << pt << "\n";
		if (pt.r > maxr) 
			maxr = pt.r;
		avgr += pt.r;
		if (pt.g > maxg) 
			maxg = pt.g;
		avgg += pt.g;
		if (pt.b > maxb) 
			maxb = pt.b;
		avgb += pt.b;
		if (pt.x > maxx) 
			maxx = pt.x;
		avgx += pt.x;
		if (pt.y > maxy) 
			maxy = pt.y;
		avgy += pt.y;
		if (pt.z > maxz) 
			maxr = pt.z;
		avgz += pt.z;
	}
	avgr /= cloud_cylinder->points.size();
	avgg /= cloud_cylinder->points.size();
	avgb /= cloud_cylinder->points.size();
	avgx /=	cloud_cylinder->points.size();
	avgy /= cloud_cylinder->points.size();
	avgz /= cloud_cylinder->points.size();


	ROS_INFO("There is a cylinder at approx (%f, %f, %f) with avg colors %d, %d, %d", avgx, avgy, avgz, avgr, avgg, avgb);

	return;

}

int main(int argc, char** argv)
{
	// Initialize
	ros::init (argc, argv, "point_finder");
	ros::NodeHandle nh;

	ROS_INFO("Listening");

	// Create a ROS subscriber for the input point cloud
	ros::Subscriber sub = nh.subscribe("/kinect2/hd/points", 1, cloud_cb);

	// Spin
	ros::spin();
}
