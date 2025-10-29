# Silverback ARM HPC Cluster User Manual

## Overview

Welcome to the Silverback ARM HPC cluster running Rocky Linux 9.6. This manual provides essential information for using our ARM-based computing resources.

### System Specifications
- **Architecture**: ARM64 (aarch64) with Neoverse-N1 processors
- **Nodes**: 16 compute nodes (node0-15)
- **Per Node**: 128 CPU cores, 256GB RAM
- **Total**: 2,048 CPU cores cluster-wide
- **Scheduler**: SLURM
- **OS**: Rocky Linux 9.6 (Blue Onyx)
- **Cluster Management**: Warewulf 4.6.1 for node provisioning and management

## Getting Started

### Accessing the Cluster

To connect to the Silverback cluster, use SSH from your terminal:

```bash
ssh username@silverback.temple.edu
```

Replace `username` with your assigned username. You'll be prompted for your password.

### First Time Login

On your first login:
1. You'll be placed in your home directory: `/home/username`
2. Check available disk space: `quota -s`
3. Load the module system: `module avail` (to see available software)

## Storage

The cluster provides multiple storage options optimized for different use cases. Understanding where to place your data ensures optimal performance and proper backup coverage.

### Storage Locations

#### Home Directory (`/home/username`)
Your personal workspace for scripts, source code, and configuration files.
- **Size**: 14TB total capacity
- **Backup**: Regularly backed up
- **Performance**: 1.5 GB/s write speed
- **Best for**: Source code, scripts, small files, and personal configurations

#### Scratch Space (`/scratch`)
High-speed temporary storage on each compute node.
- **Size**: 894GB NVMe per node
- **Performance**: 2.8 GB/s write speed (NVMe PCIe 4.0 - fastest available)
- **Backup**: NOT backed up
- **Shared**: Node-local only (each node has its own `/scratch`)
- **Best for**: Temporary job I/O, intermediate files during computation

#### Shared Data Storage (`/data`)
Fast shared storage for active datasets (Silverback only).
- **Size**: 28TB
- **Performance**: 1.1 GB/s write speed
- **Backup**: Regularly backed up
- **Availability**: Silverback cluster only
- **Best for**: Active datasets requiring maximum speed

#### Extended Storage (`/storage`)
Large-scale storage for datasets that exceed `/data` capacity.
- **Size**: 146TB
- **Performance**: 1.0 GB/s write speed over 10GbE
- **Backup**: Selectively backed up
- **Availability**: Shared across both Magilla and Silverback clusters
- **Best for**: Large datasets, shared projects across clusters

#### Archive Storage (`/archive`)
Long-term archival storage for completed projects.
- **Size**: 54TB
- **Performance**: 1.0 GB/s write speed over 10GbE
- **Backup**: Selectively backed up
- **Availability**: Shared across both Magilla and Silverback clusters
- **Best for**: Completed projects, long-term data retention

**Total storage capacity: ~243TB**

### Quick Reference Guide

| Location | Size | Speed | Backed Up | Shared Across Clusters | Best Use |
|----------|------|-------|-----------|------------------------|----------|
| `/home` | 14TB | 1.5 GB/s | Yes | No | Scripts, source code |
| `/scratch` | 894GB/node | 2.8 GB/s | No | No (node-local) | Temporary job files |
| `/data` | 28TB | 1.1 GB/s | Yes | No (Silverback only) | Active datasets |
| `/storage` | 146TB | 1.0 GB/s | Selective | Yes (Magilla + Silverback) | Large shared datasets |
| `/archive` | 54TB | 1.0 GB/s | Selective | Yes (Magilla + Silverback) | Long-term archival |

### Performance Tips

For optimal I/O performance on your jobs:

1. **Temporary files**: Use node-local `/scratch` (2.8 GB/s) for intermediate files during jobs
2. **Active processing**: Use `/data` (1.1 GB/s) for datasets actively being processed on Silverback
3. **Large datasets**: Use `/storage` (1.0 GB/s) for datasets too large for `/data` or when sharing with Magilla
4. **Cross-cluster work**: Use `/storage` or `/archive` for projects spanning both Magilla and Silverback
5. **Completed projects**: Move finished work to `/archive` to free up space in `/data` and `/storage`


## File Transfer

### SCP (Secure Copy)
Transfer files to Silverback:
```bash
scp localfile.txt username@silverback.temple.edu:~/
```

Transfer files from Silverback:
```bash
scp username@silverback.temple.edu:~/remotefile.txt ./
```

### RSYNC
For larger transfers or syncing directories:
```bash
rsync -avz local_directory/ username@silverback.temple.edu:~/remote_directory/
```

## Running Jobs

### Interactive Sessions
For testing and development:
```bash
srun --pty bash
```

### Batch Jobs
Create a job script (example: `myjob.sh`):
```bash
#!/bin/bash
#SBATCH --job-name=test
#SBATCH --time=01:00:00
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --mem=4G

# Your commands here
module load hyphy
hyphy myscript.bf
```

Submit the job:
```bash
sbatch myjob.sh
```

### Monitoring Jobs
Check job status:
```bash
squeue -u $USER
```

Cancel a job:
```bash
scancel <jobid>
```

## Software

### Using Modules
List available software:
```bash
module avail
```

Load software:
```bash
module load python/3.9
```

List loaded modules:
```bash
module list
```

### Available Software Modules
- **Compilers**: gnu14/14.2.0, armclang/1.0, arm-compiler/1.0
- **MPI**: openmpi-arm/5.0.5, arm-openmpi/5.0.5
- **Bioinformatics**: 
  - hyphy (2.5.72, 2.5.73, 2.5.74)
  - iqtree (1.6.12, 2.4.0)
  - mafft/7.526
  - muscle/3.8.31
  - fasttree/2.1.11
  - raxml-ng/1.2.2
  - paml/4.10.7
  - hmmer/3.4
  - tn93/1.0.14
- **Tools**: cmake/3.24.2, prun/2.2
- **Libraries**: libfabric/1.18.0, hwloc/2.11.1, ucx/1.17.0, pmix/4.2.9

Use `module avail` to see the complete current list.

## Quick Examples

### HyPhy Analysis Job
```bash
#!/bin/bash
#SBATCH --job-name=hyphy_test
#SBATCH --time=00:30:00
#SBATCH --mem=8G

module load hyphy/2.5.74
hyphy LIBPATH=/path/to/hyphy/res/ myanalysis.bf
```

### Parallel Job (MPI)
```bash
#!/bin/bash
#SBATCH --job-name=mpi_test
#SBATCH --time=02:00:00
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=128

module load openmpi-arm/5.0.5
mpirun ./myprogram
```

### IQ-TREE Phylogenetic Analysis
```bash
#!/bin/bash
#SBATCH --job-name=iqtree
#SBATCH --time=04:00:00
#SBATCH --cpus-per-task=32
#SBATCH --mem=64G

module load iqtree/2.4.0
iqtree -s alignment.fasta -m MFP -T AUTO
```

### Using Local Scratch Space
```bash
#!/bin/bash
#SBATCH --job-name=scratch_job
#SBATCH --time=02:00:00
#SBATCH --nodes=1
#SBATCH --ntasks=1

# Copy input data to fast local scratch
cp /home/$USER/input_data.tar.gz /scratch/
cd /scratch

# Extract and process
tar -xzf input_data.tar.gz
./process_data.sh

# Copy results back before job ends
cp -r results/ /home/$USER/
```

## Containers (Apptainer/Singularity)

Silverback supports containerized applications using Apptainer (version 1.4.0), which provides compatibility with Docker containers while running without root privileges.

### Building Containers

Silverback supports **unprivileged container builds** with fakeroot enabled for all users. You can build ARM64 containers directly on the cluster without sudo.

Build from Docker Hub:
```bash
apptainer build myapp.sif docker://ubuntu:22.04
```

Build with fakeroot (for definition files requiring root):
```bash
apptainer build --fakeroot myapp.sif myapp.def
```

**Important**: Containers must be ARM64 compatible. AMD64 containers built on other systems will not work on Silverback.

#### Custom Definition File Example
Create a definition file (`r-geospatial.def`) for R with spatial packages:
```dockerfile
Bootstrap: docker
From: r-base:4.3.0

%post
    apt-get update
    apt-get install -y libudunits2-dev libgdal-dev libgeos-dev libproj-dev
    R -e "install.packages(c('sf', 'terra', 'raster'), repos='https://cran.rstudio.com/')"

%runscript
    exec R "$@"
```

Build the container:
```bash
apptainer build --fakeroot r-geospatial.sif r-geospatial.def
```

### Running Containers in Jobs

#### Basic Container Job
```bash
#!/bin/bash
#SBATCH --job-name=container_job
#SBATCH --time=01:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G

# Run container with automatic home/scratch binding
apptainer exec myapp.sif python /home/$USER/script.py
```

#### Container with Custom Binds
```bash
#!/bin/bash
#SBATCH --job-name=container_bind
#SBATCH --time=02:00:00
#SBATCH --mem=16G

# Bind additional directories
apptainer exec \
  --bind /scratch:/scratch \
  --bind /home/$USER/data:/data \
  myapp.sif ./analysis --input /data --output /scratch/results
```

#### Using Docker Images Directly
```bash
#!/bin/bash
#SBATCH --job-name=docker_job
#SBATCH --time=01:00:00
#SBATCH --mem=8G

# Pull and run Docker image directly
apptainer exec docker://python:3.9 python script.py
```

#### Interactive Container Session
```bash
# Start interactive session with a container
srun --pty apptainer exec mycontainer.sif /bin/bash

# Or directly run interactive R in a container
srun --mpi=none --pty apptainer exec r-geospatial.sif R
```

### Container Best Practices

1. **Build on Silverback**: Build containers directly on the login node for native ARM64 compatibility
2. **Use Fakeroot**: Use `--fakeroot` flag when building from definition files that need root access
3. **ARM64 Only**: Containers built on AMD64 systems (Intel/AMD) will not work - build directly on Silverback
4. **Use Scratch**: Store containers in `/scratch` for faster access during jobs
5. **Bind Paths**: Explicitly bind directories your container needs
6. **Cache Location**: Set `APPTAINER_CACHEDIR=/scratch/.apptainer` for builds

### Troubleshooting Containers

**Architecture Mismatch**: If you get "Exec format error", your container was built for the wrong architecture.
```bash
# Check container architecture
apptainer inspect mycontainer.sif | grep -i arch
```

**Build Failures**: If builds fail with permission errors, ensure you're using `--fakeroot`:
```bash
apptainer build --fakeroot mycontainer.sif mycontainer.def
```

**Large Builds**: For containers that take a long time to build, use the fast local scratch:
```bash
export APPTAINER_CACHEDIR=/scratch/.apptainer
mkdir -p $APPTAINER_CACHEDIR
apptainer build --fakeroot /scratch/mycontainer.sif mycontainer.def
```

### Example Custom R Container Job
```bash
#!/bin/bash
#SBATCH --job-name=r_geospatial
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G

# Run custom R container with geospatial packages
apptainer exec \
  --bind /scratch:/scratch \
  r-geospatial.sif Rscript /home/$USER/spatial_analysis.R
```

### Example Bioinformatics Container
```bash
#!/bin/bash
#SBATCH --job-name=blast_container
#SBATCH --time=04:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G

# Use BLAST container from BioContainers
apptainer exec \
  --bind /scratch:/scratch \
  docker://biocontainers/blast:v2.13.0 \
  blastp -query /scratch/input.fasta -db /scratch/db -out /scratch/results.txt
```

## Best Practices

1. **Test First**: Run small test jobs before submitting large ones
2. **Use Scratch**: Keep large files in `/scratch`, not home
3. **Clean Up**: Delete temporary files when jobs complete
4. **Be Specific**: Request only the resources you need
5. **Check Status**: Monitor your jobs and storage usage regularly
6. **Containers**: Use Apptainer for reproducible software environments

## Getting Help

- Check job efficiency: `seff <jobid>`
- View completed job info: `sacct -j <jobid>`
- Node status: `sinfo`
- View node details: `scontrol show node <nodename>`
- Contact Steven Weaver: sweaver@temple.edu

## Quick Reference

| Command | Purpose |
|---------|---------|
| `ssh username@silverback.temple.edu` | Connect to cluster |
| `module avail` | List available software |
| `module load <software>` | Load software module |
| `sbatch script.sh` | Submit batch job |
| `squeue -u $USER` | Check your jobs |
| `scancel <jobid>` | Cancel a job |
| `sinfo` | View node status |
| `df -h ~` | Check disk usage |

## Node Status

Current cluster configuration:
- **Total Nodes**: 16 (node0-15)
- **CPUs per Node**: 128
- **Memory per Node**: 256GB
- **Local Scratch per Node**: 894GB NVMe
- **Node States**: Check with `sinfo` for current availability

---
*For additional help, contact Steven Weaver at sweaver@temple.edu*
